from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import date

@dataclass
class UserProfile:
    user_id: str
    name: str
    home_currency: str
    current_balance: float
    minimum_balance_to_keep: float
    accepted_payment_methods: List[str]
    financial_priorities: str
    willingness_to_reduce_flexible_spending: bool

@dataclass
class FinancialEvent:
    event_id: str
    user_id: str
    event_date: str
    event_type: str
    description: str
    amount: Optional[float]
    currency: str
    status: str
    is_essential: bool
    is_flexible: bool
    recurrence_interval: str  # none, weekly, biweekly, monthly
    end_date: Optional[str] = None
    related_event_id: Optional[str] = None
    extracted_from_image: bool = False

@dataclass
class ExchangeRate:
    conversion_date: str
    base_currency: str
    target_currency: str
    rate: float

@dataclass
class PaymentOption:
    payment_option_id: str
    request_id: str
    option_type: str
    first_payment_date: str
    number_of_payments: int
    days_between_payments: int
    financing_fees: float
    total_payable_amount: float
    payment_amounts: List[float]

@dataclass
class FinancialRequest:
    request_id: str
    user_id: str
    request_date: str
    purchase_description: str
    requested_amount: float
    currency: str
    desired_completion_date: str
    request_type: str
    allows_partial_payment: bool

@dataclass
class MessageRecord:
    message_id: str
    user_id: str
    request_id: str
    related_event_id: str
    timestamp: str
    sender: str
    content: str

@dataclass
class ImageRecord:
    image_id: str
    related_event_id: str
    file_path: str
    description: str
    extracted_amount: Optional[float] = None

@dataclass
class ForecastDay:
    date: str
    day_offset: int
    starting_balance: float
    ending_balance: float
    income_total: float
    expense_total: float
    min_required_balance: float
    is_safe: bool
    events: List[Dict[str, Any]] = field(default_factory=list)

@dataclass
class ScenarioResult:
    scenario_name: str  # full_payment, partial_payment, installments, wait, not_proceeding
    method: str
    is_safe: bool
    is_accepted_by_user: bool
    completed_by_deadline: bool
    requires_spending_changes: bool
    spending_changes: str
    total_amount_paid: float
    first_payment_date: str
    final_payment_date: str
    lowest_projected_balance: float
    payment_plan: str
    payment_option_id: Optional[str] = None
    number_of_payments: int = 1
    rejection_reason: Optional[str] = None

@dataclass
class EvaluationResult:
    request_id: str
    amount_safe_to_pay: float
    affordability_status: str
    recommended_payment_method: str
    payment_plan: str
    earliest_date_for_full_payment: str
    spending_changes_needed: str
    decision_explanation: str
    baseline_forecast: List[ForecastDay]
    recommended_forecast: List[ForecastDay]
    scenarios: List[ScenarioResult]
    extracted_images: List[Dict[str, Any]] = field(default_factory=list)
