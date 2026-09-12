from typing import List, Dict, Any, Tuple
from datetime import datetime
from backend.engine.models import FinancialRequest, EvaluationResult, UserProfile, FinancialEvent, PaymentOption

REQUIRED_COLUMNS = [
    "request_id",
    "amount_safe_to_pay",
    "affordability_status",
    "recommended_payment_method",
    "payment_plan",
    "earliest_date_for_full_payment",
    "spending_changes_needed",
    "decision_explanation"
]

class OutputValidator:
    def validate_evaluation_result(
        self,
        eval_res: EvaluationResult,
        request: FinancialRequest,
        user: UserProfile,
        events: List[FinancialEvent],
        payment_options: List[PaymentOption]
    ) -> Tuple[bool, List[str]]:
        errors = []

        # 1. amount_safe_to_pay is between 0 and requested_amount
        if eval_res.amount_safe_to_pay < 0.0:
            errors.append(f"amount_safe_to_pay {eval_res.amount_safe_to_pay} < 0")
        if eval_res.amount_safe_to_pay > request.requested_amount + 0.01:
            errors.append(f"amount_safe_to_pay {eval_res.amount_safe_to_pay} > requested_amount {request.requested_amount}")

        # 2. affordable_now has earliest_date_for_full_payment equal to request_date
        if eval_res.affordability_status == "affordable_now":
            if eval_res.earliest_date_for_full_payment != request.request_date:
                errors.append(
                    f"Status is affordable_now but earliest_date_for_full_payment ({eval_res.earliest_date_for_full_payment}) != request_date ({request.request_date})"
                )

        # 3. Empty earliest_date_for_full_payment used only when full amount not safe within 90 days
        if eval_res.earliest_date_for_full_payment == "":
            if eval_res.affordability_status in ["affordable_now", "affordable_later"]:
                errors.append(f"Status is {eval_res.affordability_status} but earliest_date_for_full_payment is empty")

        # 4. Payment plans are chronological
        plan_str = eval_res.payment_plan
        if plan_str and plan_str != "none":
            dates = []
            for item in plan_str.split("|"):
                if ":" in item:
                    dates.append(item.split(":")[0])
            for i in range(len(dates) - 1):
                if dates[i] > dates[i+1]:
                    errors.append(f"Payment plan dates not chronological: {dates[i]} > {dates[i+1]}")

        # 5. Partial payment plans contain exactly two payments and sum to requested amount
        if eval_res.recommended_payment_method == "partial_payment":
            parts = plan_str.split("|")
            if len(parts) != 2:
                errors.append(f"Partial payment plan must contain exactly 2 payments, got {len(parts)}: {plan_str}")
            else:
                try:
                    p1_amt = float(parts[0].split(":")[1])
                    p2_amt = float(parts[1].split(":")[1])
                    tot = round(p1_amt + p2_amt, 2)
                    if abs(tot - request.requested_amount) > 0.05:
                        errors.append(f"Partial payments sum {tot} does not equal requested_amount {request.requested_amount}")
                except Exception as e:
                    errors.append(f"Error parsing partial payment amounts: {str(e)}")

        # 6. Installment plans exactly match supplied options
        if eval_res.recommended_payment_method == "installments":
            matching_opts = [opt for opt in payment_options if opt.request_id == request.request_id]
            matched = False
            for opt in matching_opts:
                # build option plan string
                start_dt = datetime.strptime(opt.first_payment_date, "%Y-%m-%d")
                sched = []
                from datetime import timedelta
                for idx, a in enumerate(opt.payment_amounts):
                    dt = start_dt + timedelta(days=idx * opt.days_between_payments)
                    sched.append(f"{dt.strftime('%Y-%m-%d')}:{float(a):.2f}")
                cand_plan = "|".join(sched)
                if cand_plan == plan_str:
                    matched = True
                    break
            if not matched:
                errors.append(f"Installment plan '{plan_str}' does not match any supplied option in request_payment_options.csv")

        # 7. Final request payment no later than desired_completion_date
        if plan_str and plan_str != "none":
            final_p_date = plan_str.split("|")[-1].split(":")[0]
            if final_p_date > request.desired_completion_date:
                errors.append(f"Final payment date {final_p_date} > desired_completion_date {request.desired_completion_date}")

        # 8. Spending changes reference only flexible recurring events
        spending = eval_res.spending_changes_needed
        if spending and spending != "none":
            user_flex_ids = {e.event_id for e in events if e.user_id == user.user_id and e.is_flexible and not e.is_essential}
            for ch in spending.split("|"):
                if ":" in ch:
                    eid = ch.split(":")[1]
                    if eid not in user_flex_ids:
                        errors.append(f"Spending change references non-flexible or non-user event: {eid}")

        return (len(errors) == 0, errors)
