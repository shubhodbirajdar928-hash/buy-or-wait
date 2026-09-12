from typing import List, Dict, Tuple, Optional, Any
from backend.engine.models import UserProfile, FinancialEvent

class SpendingOptimizer:
    def __init__(self):
        pass

    def get_flexible_recurring_events(self, events: List[FinancialEvent], user_id: str) -> List[FinancialEvent]:
        valid = []
        for e in events:
            if e.user_id == user_id and e.is_flexible and not e.is_essential:
                if (e.recurrence_interval or "none").lower() != "none" or "recurring" in e.event_type.lower():
                    if (e.amount or 0.0) > 0 and e.status.lower() not in ["failed", "cancelled", "pending"]:
                        valid.append(e)
        return valid

    def find_spending_changes_for_shortfall(
        self,
        user: UserProfile,
        events: List[FinancialEvent],
        shortfall: float
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Attempts to find up to 3 flexible spending adjustments to cover shortfall.
        Returns: (formatted_string, changes_dict)
        """
        if not user.willingness_to_reduce_flexible_spending or shortfall <= 0:
            return "none", {}

        flex_events = self.get_flexible_recurring_events(events, user.user_id)
        if not flex_events:
            return "none", {}

        # Sort flexible events by amount descending to minimize count of changes
        flex_events.sort(key=lambda x: (x.amount or 0.0), reverse=True)

        selected_changes: List[str] = []
        changes_dict: Dict[str, Any] = {}
        covered = 0.0

        for ev in flex_events:
            if len(selected_changes) >= 3:
                break

            amt = ev.amount or 0.0
            needed = shortfall - covered
            
            # If reducing by half or partial is enough
            if amt > needed > 0 and (amt - needed) >= 10:
                new_amt = round(amt - needed, 2)
                selected_changes.append(f"reduce_to:{ev.event_id}:{new_amt:.2f}")
                changes_dict[ev.event_id] = new_amt
                covered += (amt - new_amt)
                break
            else:
                # Stop the event entirely
                selected_changes.append(f"stop:{ev.event_id}")
                changes_dict[ev.event_id] = "stop"
                covered += amt

            if covered >= shortfall:
                break

        if covered >= shortfall and selected_changes:
            return "|".join(selected_changes), changes_dict

        # If not enough to cover, return none or empty changes
        return "none", {}
