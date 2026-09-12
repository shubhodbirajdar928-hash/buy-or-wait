from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional, Any
from backend.engine.models import UserProfile, FinancialEvent, ForecastDay
from backend.engine.currency import CurrencyConverter

class BalanceForecaster:
    def __init__(self, currency_converter: CurrencyConverter):
        self.converter = currency_converter

    def parse_date(self, date_str: str) -> datetime:
        return datetime.strptime(date_str.strip(), "%Y-%m-%d")

    def format_date(self, dt: datetime) -> str:
        return dt.strftime("%Y-%m-%d")

    def expand_events_for_window(
        self,
        events: List[FinancialEvent],
        start_date: datetime,
        end_date: datetime,
        spending_changes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Expands all valid financial events across the date window [start_date, end_date].
        Returns a dict mapping date_string ('YYYY-MM-DD') to list of event dicts.
        """
        spending_changes = spending_changes or {}
        daily_events: Dict[str, List[Dict[str, Any]]] = {}
        
        seen_event_keys = set() # Duplicate detection

        for event in events:
            # 1. Filter out invalid/ignored events
            status = event.status.lower().strip()
            etype = event.event_type.lower().strip()

            # Ignore pending credits, failed, cancelled
            if etype in ["pending_credit", "failed_transaction", "cancelled_transaction"]:
                continue
            if status in ["failed", "cancelled", "pending"]:
                continue

            # Check duplicate records
            dup_key = (event.event_id, event.event_date, event.amount, event.description)
            if dup_key in seen_event_keys:
                continue
            seen_event_keys.add(dup_key)

            # Check if event stopped by spending changes
            if spending_changes.get(event.event_id) == "stop":
                continue

            amount = event.amount if event.amount is not None else 0.0
            
            # Check if event amount reduced by spending changes
            if event.event_id in spending_changes and isinstance(spending_changes[event.event_id], (int, float)):
                amount = float(spending_changes[event.event_id])

            if amount <= 0:
                continue

            # Parse event start date and end date
            try:
                e_date = self.parse_date(event.event_date)
            except ValueError:
                continue

            e_end = end_date
            if event.end_date:
                try:
                    parsed_end = self.parse_date(event.end_date)
                    e_end = min(e_end, parsed_end)
                except ValueError:
                    pass

            recurrence = (event.recurrence_interval or "none").lower().strip()

            # Generate occurrence dates
            occurrence_dates = []
            if recurrence == "none":
                if start_date <= e_date <= end_date:
                    occurrence_dates.append(e_date)
            elif recurrence == "weekly":
                curr = e_date
                while curr <= e_end:
                    if curr >= start_date:
                        occurrence_dates.append(curr)
                    curr += timedelta(days=7)
            elif recurrence == "biweekly":
                curr = e_date
                while curr <= e_end:
                    if curr >= start_date:
                        occurrence_dates.append(curr)
                    curr += timedelta(days=14)
            elif recurrence == "monthly":
                curr = e_date
                while curr <= e_end:
                    if curr >= start_date:
                        occurrence_dates.append(curr)
                    # Approximate monthly recurrence safely by advancing month or +30 days
                    # Advance 1 month
                    year = curr.year + (1 if curr.month == 12 else 0)
                    month = 1 if curr.month == 12 else curr.month + 1
                    day = min(e_date.day, 28) # protect against month lengths
                    try:
                        curr = datetime(year, month, day)
                    except ValueError:
                        curr += timedelta(days=30)

            # Determine whether income or expense
            is_income = "income" in etype or "salary" in etype or "bonus" in etype

            for occ_dt in occurrence_dates:
                d_str = self.format_date(occ_dt)
                if d_str not in daily_events:
                    daily_events[d_str] = []

                daily_events[d_str].append({
                    "event_id": event.event_id,
                    "description": event.description,
                    "event_type": event.event_type,
                    "raw_amount": amount,
                    "raw_currency": event.currency,
                    "is_income": is_income,
                    "is_essential": event.is_essential,
                    "is_flexible": event.is_flexible,
                    "extracted_from_image": event.extracted_from_image
                })

        return daily_events

    def run_forecast(
        self,
        user: UserProfile,
        events: List[FinancialEvent],
        request_date_str: str,
        scheduled_payments: Optional[List[Tuple[str, float]]] = None, # [(date_str, amount_in_user_curr)]
        spending_changes: Optional[Dict[str, Any]] = None,
        days_ahead: int = 90
    ) -> Tuple[List[ForecastDay], bool, float, float]:
        """
        Runs full 90-day balance forecast.
        Returns: (forecast_days, is_safe, min_buffer, lowest_balance)
        """
        start_date = self.parse_date(request_date_str)
        end_date = start_date + timedelta(days=days_ahead)

        daily_events = self.expand_events_for_window(events, start_date, end_date, spending_changes)

        # Map scheduled purchase payments by date
        purchase_payments: Dict[str, float] = {}
        if scheduled_payments:
            for p_date, p_amt in scheduled_payments:
                p_date_clean = p_date.strip()
                purchase_payments[p_date_clean] = purchase_payments.get(p_date_clean, 0.0) + p_amt

        current_balance = user.current_balance
        min_balance = user.minimum_balance_to_keep

        forecast_days: List[ForecastDay] = []
        is_safe = True
        min_buffer = float("inf")
        lowest_balance = float("inf")

        for offset in range(days_ahead + 1):
            curr_dt = start_date + timedelta(days=offset)
            d_str = self.format_date(curr_dt)

            day_events = daily_events.get(d_str, [])
            starting_bal = current_balance

            day_income = 0.0
            day_expense = 0.0
            detailed_events = []

            for ev in day_events:
                # Convert to user home currency
                amt_home = self.converter.convert(
                    ev["raw_amount"],
                    ev["raw_currency"],
                    user.home_currency,
                    d_str
                )
                ev_copy = dict(ev)
                ev_copy["amount_home_currency"] = amt_home

                if ev["is_income"]:
                    day_income += amt_home
                else:
                    day_expense += amt_home

                detailed_events.append(ev_copy)

            # Add purchase plan payments scheduled on this day
            if d_str in purchase_payments:
                plan_amt = purchase_payments[d_str]
                day_expense += plan_amt
                detailed_events.append({
                    "event_id": "REQ_PAYMENT",
                    "description": f"Scheduled Purchase Payment",
                    "event_type": "request_payment",
                    "raw_amount": plan_amt,
                    "raw_currency": user.home_currency,
                    "amount_home_currency": plan_amt,
                    "is_income": False,
                    "is_essential": True,
                    "is_flexible": False,
                    "extracted_from_image": False
                })

            ending_bal = starting_bal + day_income - day_expense
            current_balance = ending_bal

            day_buffer = ending_bal - min_balance
            if day_buffer < min_buffer:
                min_buffer = day_buffer
            if ending_bal < lowest_balance:
                lowest_balance = ending_bal

            day_safe = ending_bal >= min_balance
            if not day_safe:
                is_safe = False

            forecast_days.append(ForecastDay(
                date=d_str,
                day_offset=offset,
                starting_balance=round(starting_bal, 2),
                ending_balance=round(ending_bal, 2),
                income_total=round(day_income, 2),
                expense_total=round(day_expense, 2),
                min_required_balance=min_balance,
                is_safe=day_safe,
                events=detailed_events
            ))

        return forecast_days, is_safe, round(min_buffer, 2), round(lowest_balance, 2)
