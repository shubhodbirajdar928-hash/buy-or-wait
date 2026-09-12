from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional, Any
from backend.engine.models import (
    UserProfile, FinancialEvent, FinancialRequest, PaymentOption,
    ScenarioResult, EvaluationResult, ForecastDay
)
from backend.engine.forecaster import BalanceForecaster
from backend.engine.currency import CurrencyConverter
from backend.engine.spending_optimizer import SpendingOptimizer

class AffordabilityEvaluator:
    def __init__(self, forecaster: BalanceForecaster, converter: CurrencyConverter):
        self.forecaster = forecaster
        self.converter = converter
        self.optimizer = SpendingOptimizer()

    def parse_date(self, s: str) -> datetime:
        return datetime.strptime(s.strip(), "%Y-%m-%d")

    def format_date(self, dt: datetime) -> str:
        return dt.strftime("%Y-%m-%d")

    def calculate_amount_safe_to_pay(
        self,
        user: UserProfile,
        events: List[FinancialEvent],
        request: FinancialRequest,
        requested_amount_home: float
    ) -> float:
        """
        The largest amount the user can pay on request_date before optional spending changes,
        capped at requested_amount. Satisfies 0 <= amount_safe_to_pay <= requested_amount.
        """
        # Run baseline forecast without purchase
        _, _, min_buffer, _ = self.forecaster.run_forecast(
            user=user,
            events=events,
            request_date_str=request.request_date,
            scheduled_payments=None,
            spending_changes=None,
            days_ahead=90
        )
        safe_amt = max(0.0, min(requested_amount_home, min_buffer))
        return round(safe_amt, 2)

    def find_earliest_date_for_full_payment(
        self,
        user: UserProfile,
        events: List[FinancialEvent],
        request: FinancialRequest,
        requested_amount_home: float,
        spending_changes: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Calculates earliest date within 90 days where paying full amount leaves balance >= min_balance.
        """
        req_dt = self.parse_date(request.request_date)
        for offset in range(91):
            cand_dt = req_dt + timedelta(days=offset)
            cand_str = self.format_date(cand_dt)
            _, is_safe, _, _ = self.forecaster.run_forecast(
                user=user,
                events=events,
                request_date_str=request.request_date,
                scheduled_payments=[(cand_str, requested_amount_home)],
                spending_changes=spending_changes,
                days_ahead=90
            )
            if is_safe:
                return cand_str
        return ""

    def evaluate_request(
        self,
        user: UserProfile,
        events: List[FinancialEvent],
        request: FinancialRequest,
        payment_options: List[PaymentOption]
    ) -> Tuple[EvaluationResult, List[ScenarioResult]]:
        # Convert requested amount to user home currency if needed
        requested_amt_home = self.converter.convert(
            request.requested_amount,
            request.currency,
            user.home_currency,
            request.request_date
        )

        req_dt = self.parse_date(request.request_date)
        deadline_dt = self.parse_date(request.desired_completion_date)

        # 1. Baseline forecast & Safe amount today
        baseline_days, base_safe, base_buffer, base_lowest = self.forecaster.run_forecast(
            user=user,
            events=events,
            request_date_str=request.request_date,
            days_ahead=90
        )

        safe_to_pay_today = self.calculate_amount_safe_to_pay(
            user, events, request, requested_amt_home
        )

        earliest_full_date = self.find_earliest_date_for_full_payment(
            user, events, request, requested_amt_home
        )

        accepted_methods = [m.lower().strip() for m in user.accepted_payment_methods]

        scenarios: List[ScenarioResult] = []

        # ==========================================
        # Scenario 1: Pay in Full Today
        # ==========================================
        full_payments = [(request.request_date, requested_amt_home)]
        _, full_safe, full_buff, full_low = self.forecaster.run_forecast(
            user, events, request.request_date, scheduled_payments=full_payments
        )
        full_accepted = "full_payment" in accepted_methods
        full_plan_str = f"{request.request_date}:{requested_amt_home:.2f}"
        scenarios.append(ScenarioResult(
            scenario_name="Pay in Full Today",
            method="full_payment",
            is_safe=full_safe,
            is_accepted_by_user=full_accepted,
            completed_by_deadline=req_dt <= deadline_dt,
            requires_spending_changes=False,
            spending_changes="none",
            total_amount_paid=requested_amt_home,
            first_payment_date=request.request_date,
            final_payment_date=request.request_date,
            lowest_projected_balance=full_low,
            payment_plan=full_plan_str,
            payment_option_id=None,
            number_of_payments=1,
            rejection_reason=None if (full_safe and full_accepted) else ("Violates minimum balance" if not full_safe else "Not accepted by user")
        ))

        # ==========================================
        # Scenario 2: Partial Payment
        # ==========================================
        partial_safe = False
        partial_plan_str = "none"
        partial_first_date = request.request_date
        partial_final_date = ""
        partial_low = base_lowest
        partial_accepted = "partial_payment" in accepted_methods and request.allows_partial_payment

        if partial_accepted and 0 < safe_to_pay_today < requested_amt_home:
            rem_amt = round(requested_amt_home - safe_to_pay_today, 2)
            # Find earliest safe date for remainder <= deadline
            best_rem_date = None
            best_rem_low = float("inf")
            for offset in range(1, 91):
                c_dt = req_dt + timedelta(days=offset)
                if c_dt > deadline_dt:
                    break
                c_str = self.format_date(c_dt)
                p_sched = [(request.request_date, safe_to_pay_today), (c_str, rem_amt)]
                _, is_s, _, l_bal = self.forecaster.run_forecast(
                    user, events, request.request_date, scheduled_payments=p_sched
                )
                if is_s:
                    best_rem_date = c_str
                    best_rem_low = l_bal
                    break

            if best_rem_date:
                partial_safe = True
                partial_final_date = best_rem_date
                partial_plan_str = f"{request.request_date}:{safe_to_pay_today:.2f}|{best_rem_date}:{rem_amt:.2f}"
                partial_low = best_rem_low

        scenarios.append(ScenarioResult(
            scenario_name="Partial Payment",
            method="partial_payment",
            is_safe=partial_safe,
            is_accepted_by_user=partial_accepted,
            completed_by_deadline=bool(partial_final_date and self.parse_date(partial_final_date) <= deadline_dt),
            requires_spending_changes=False,
            spending_changes="none",
            total_amount_paid=requested_amt_home,
            first_payment_date=partial_first_date,
            final_payment_date=partial_final_date if partial_final_date else request.request_date,
            lowest_projected_balance=partial_low,
            payment_plan=partial_plan_str,
            payment_option_id=None,
            number_of_payments=2,
            rejection_reason=None if partial_safe else (
                "Not allowed for request" if not request.allows_partial_payment else (
                    "Not accepted by user" if "partial_payment" not in accepted_methods else (
                        "Zero initial safe amount" if safe_to_pay_today <= 0 else "Cannot complete remainder safely by deadline"
                    )
                )
            )
        ))

        # ==========================================
        # Scenario 3: Installment Options
        # ==========================================
        req_options = [opt for opt in payment_options if opt.request_id == request.request_id]
        inst_accepted = "installments" in accepted_methods

        for opt in req_options:
            first_dt = self.parse_date(opt.first_payment_date)
            # Build schedule
            sched: List[Tuple[str, float]] = []
            for i, p_amt in enumerate(opt.payment_amounts):
                p_dt = first_dt + timedelta(days=i * opt.days_between_payments)
                sched.append((self.format_date(p_dt), float(p_amt)))

            final_p_dt = self.parse_date(sched[-1][0])
            completed_by_deadline = final_p_dt <= deadline_dt

            # Test safety
            _, opt_safe, opt_buff, opt_low = self.forecaster.run_forecast(
                user, events, request.request_date, scheduled_payments=sched
            )

            # Check if spending changes could rescue it if not safe
            spending_str = "none"
            changes_dict = {}
            if not opt_safe and user.willingness_to_reduce_flexible_spending:
                shortfall = abs(opt_buff) + 10.0
                spending_str, changes_dict = self.optimizer.find_spending_changes_for_shortfall(
                    user, events, shortfall
                )
                if changes_dict:
                    _, opt_safe_rescued, _, opt_low = self.forecaster.run_forecast(
                        user, events, request.request_date, scheduled_payments=sched, spending_changes=changes_dict
                    )
                    if opt_safe_rescued:
                        opt_safe = True

            plan_str = "|".join([f"{d}:{a:.2f}" for d, a in sched])
            scenarios.append(ScenarioResult(
                scenario_name=f"Installment Plan ({opt.payment_option_id})",
                method="installments",
                is_safe=opt_safe,
                is_accepted_by_user=inst_accepted,
                completed_by_deadline=completed_by_deadline,
                requires_spending_changes=(spending_str != "none"),
                spending_changes=spending_str,
                total_amount_paid=round(opt.total_payable_amount, 2),
                first_payment_date=sched[0][0],
                final_payment_date=sched[-1][0],
                lowest_projected_balance=opt_low,
                payment_plan=plan_str,
                payment_option_id=opt.payment_option_id,
                number_of_payments=len(sched),
                rejection_reason=None if (opt_safe and inst_accepted and completed_by_deadline) else (
                    "Not accepted by user" if not inst_accepted else (
                        "Exceeds desired completion deadline" if not completed_by_deadline else "Violates minimum balance threshold"
                    )
                )
            ))

        # ==========================================
        # Scenario 4: Wait and Pay Later
        # ==========================================
        wait_safe = False
        wait_plan_str = "none"
        wait_date = earliest_full_date
        wait_low = base_lowest
        wait_accepted = "full_payment" in accepted_methods or "wait" in accepted_methods

        if wait_date and wait_accepted:
            w_dt = self.parse_date(wait_date)
            if w_dt <= deadline_dt and w_dt > req_dt:
                wait_safe = True
                wait_plan_str = f"{wait_date}:{requested_amt_home:.2f}"
                _, _, _, wait_low = self.forecaster.run_forecast(
                    user, events, request.request_date, scheduled_payments=[(wait_date, requested_amt_home)]
                )

        scenarios.append(ScenarioResult(
            scenario_name="Wait and Pay Later",
            method="wait",
            is_safe=wait_safe,
            is_accepted_by_user=wait_accepted,
            completed_by_deadline=bool(wait_date and self.parse_date(wait_date) <= deadline_dt),
            requires_spending_changes=False,
            spending_changes="none",
            total_amount_paid=requested_amt_home,
            first_payment_date=wait_date if wait_date else "",
            final_payment_date=wait_date if wait_date else "",
            lowest_projected_balance=wait_low,
            payment_plan=wait_plan_str,
            payment_option_id=None,
            number_of_payments=1,
            rejection_reason=None if wait_safe else (
                "Cannot afford within forecast period" if not wait_date else (
                    "Earliest safe date exceeds completion deadline" if (wait_date and self.parse_date(wait_date) > deadline_dt) else "Immediate option preferred or already safe"
                )
            )
        ))

        # ==========================================
        # Scenario 5: Not Proceeding
        # ==========================================
        scenarios.append(ScenarioResult(
            scenario_name="Do Not Proceed",
            method="not_recommended",
            is_safe=True,
            is_accepted_by_user=True,
            completed_by_deadline=True,
            requires_spending_changes=False,
            spending_changes="none",
            total_amount_paid=0.0,
            first_payment_date="",
            final_payment_date="",
            lowest_projected_balance=base_lowest,
            payment_plan="none",
            payment_option_id=None,
            number_of_payments=0,
            rejection_reason="Protects reserves by deferring purchase indefinitely"
        ))

        # ==========================================
        # Rank Valid Safe Candidates
        # ==========================================
        eligible_candidates: List[ScenarioResult] = []
        for s in scenarios:
            if s.method == "not_recommended":
                continue
            if s.is_safe and s.is_accepted_by_user and s.completed_by_deadline:
                eligible_candidates.append(s)

        # Plan-ranking rules:
        # 1. Complete full request by desired_completion_date (already filtered)
        # 2. Require no spending changes (requires_spending_changes == False first)
        # 3. Minimize total amount paid (total_amount_paid ascending)
        # 4. Start payment earlier (first_payment_date ascending)
        # 5. Use fewer payments (number_of_payments ascending)
        # 6. Use lowest payment_option_id as final tie-breaker
        def rank_key(item: ScenarioResult):
            spending_flag = 1 if item.requires_spending_changes else 0
            cost = item.total_amount_paid
            first_dt_val = item.first_payment_date or "9999-99-99"
            num_p = item.number_of_payments
            opt_id = item.payment_option_id or "OPT_000"
            return (spending_flag, cost, first_dt_val, num_p, opt_id)

        eligible_candidates.sort(key=rank_key)

        # Determine winner
        if eligible_candidates:
            winner = eligible_candidates[0]
            rec_method = winner.method
            rec_plan = winner.payment_plan
            spending_needed = winner.spending_changes

            if rec_method == "full_payment":
                aff_status = "affordable_now"
            elif rec_method in ["partial_payment", "installments"]:
                aff_status = "affordable_with_plan"
            elif rec_method == "wait":
                aff_status = "affordable_later"
            else:
                aff_status = "affordable_now"
        else:
            rec_method = "not_recommended"
            rec_plan = "none"
            spending_needed = "none"
            aff_status = "not_affordable"

        # Generate recommended forecast
        rec_sched: List[Tuple[str, float]] = []
        if rec_plan and rec_plan != "none":
            for part in rec_plan.split("|"):
                if ":" in part:
                    p_date, p_amt = part.split(":")[:2]
                    rec_sched.append((p_date.strip(), float(p_amt.strip())))

        rec_changes_dict = {}
        if spending_needed != "none":
            for ch in spending_needed.split("|"):
                if ch.startswith("stop:"):
                    rec_changes_dict[ch.split(":")[1]] = "stop"
                elif ch.startswith("reduce_to:"):
                    parts = ch.split(":")
                    rec_changes_dict[parts[1]] = float(parts[2])

        rec_days, _, _, _ = self.forecaster.run_forecast(
            user=user,
            events=events,
            request_date_str=request.request_date,
            scheduled_payments=rec_sched,
            spending_changes=rec_changes_dict,
            days_ahead=90
        )

        # Factual, concrete explanation
        from backend.engine.explainer import DecisionExplainer
        explainer = DecisionExplainer()
        explanation = explainer.generate_explanation(
            user=user,
            request=request,
            status=aff_status,
            method=rec_method,
            amount_safe_today=safe_to_pay_today,
            earliest_full_date=earliest_full_date,
            spending_changes=spending_needed,
            baseline_lowest=base_lowest,
            forecast_days=rec_days,
            scenarios=scenarios
        )

        result = EvaluationResult(
            request_id=request.request_id,
            amount_safe_to_pay=safe_to_pay_today,
            affordability_status=aff_status,
            recommended_payment_method=rec_method,
            payment_plan=rec_plan,
            earliest_date_for_full_payment=earliest_full_date,
            spending_changes_needed=spending_needed,
            decision_explanation=explanation,
            baseline_forecast=baseline_days,
            recommended_forecast=rec_days,
            scenarios=scenarios
        )

        return result, scenarios
