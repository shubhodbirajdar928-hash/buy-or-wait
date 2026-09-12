from typing import List
from backend.engine.models import UserProfile, FinancialRequest, ForecastDay, ScenarioResult

class DecisionExplainer:
    def generate_explanation(
        self,
        user: UserProfile,
        request: FinancialRequest,
        status: str,
        method: str,
        amount_safe_today: float,
        earliest_full_date: str,
        spending_changes: str,
        baseline_lowest: float,
        forecast_days: List[ForecastDay],
        scenarios: List[ScenarioResult]
    ) -> str:
        curr = user.home_currency
        req_amt = request.requested_amount
        min_res = user.minimum_balance_to_keep

        # Find key upcoming events in the first 30 days
        notable_expenses = []
        notable_incomes = []
        for d in forecast_days[:45]:
            for ev in d.events:
                if ev.get("is_income") and ev.get("raw_amount", 0) >= 500:
                    notable_incomes.append(f"{ev['description']} ({curr} {ev['amount_home_currency']:.2f}) on {d.date}")
                elif not ev.get("is_income") and ev.get("event_type") != "request_payment" and ev.get("amount_home_currency", 0) >= 200:
                    notable_expenses.append(f"{ev['description']} ({curr} {ev['amount_home_currency']:.2f}) on {d.date}")

        income_summary = notable_incomes[0] if notable_incomes else f"upcoming income on {earliest_full_date}"
        expense_summary = notable_expenses[0] if notable_expenses else "scheduled essential commitments"

        if status == "affordable_now":
            return (
                f"You can safely pay the full {curr} {req_amt:.2f} today. "
                f"Your current balance is {curr} {user.current_balance:.2f} and your projected balance "
                f"remains comfortably above your minimum reserve of {curr} {min_res:.2f} across all 90 days, "
                f"even after covering {expense_summary}."
            )

        elif status == "affordable_with_plan":
            if method == "partial_payment":
                return (
                    f"Paying {curr} {req_amt:.2f} in full today would breach your required minimum reserve of {curr} {min_res:.2f} "
                    f"due to {expense_summary}. You can safely pay {curr} {amount_safe_today:.2f} today, and the remaining "
                    f"{curr} {(req_amt - amount_safe_today):.2f} on or before your deadline after {income_summary} arrives."
                )
            elif method == "installments":
                changes_text = f" with flexible spending adjustments ({spending_changes})" if spending_changes != "none" else ""
                return (
                    f"Paying {curr} {req_amt:.2f} upfront exceeds your safe daily buffer of {curr} {amount_safe_today:.2f}. "
                    f"The recommended installment plan spreads the commitment safely{changes_text}, ensuring your balance "
                    f"never falls below your {curr} {min_res:.2f} reserve prior to your deadline of {request.desired_completion_date}."
                )

        elif status == "affordable_later":
            return (
                f"Paying {curr} {req_amt:.2f} today would reduce your projected balance below your minimum reserve of {curr} {min_res:.2f} "
                f"because of {expense_summary}. You can safely pay the full amount on {earliest_full_date} "
                f"after {income_summary} is confirmed and clears before your deadline of {request.desired_completion_date}."
            )

        else: # not_affordable
            return (
                f"This purchase of {curr} {req_amt:.2f} is not safe under any eligible payment option. "
                f"Your maximum safe payment today is {curr} {amount_safe_today:.2f}. Paying this amount would violate "
                f"your required minimum reserve of {curr} {min_res:.2f} when factoring in {expense_summary}, "
                f"and no safe payment schedule can complete by your deadline of {request.desired_completion_date}."
            )
