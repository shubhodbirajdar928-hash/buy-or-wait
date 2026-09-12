export interface UserProfile {
  user_id: string;
  name: string;
  home_currency: string;
  current_balance: number;
  minimum_balance_to_keep: number;
  accepted_payment_methods: string[];
  financial_priorities: string;
  willingness_to_reduce_flexible_spending: boolean;
  request_count?: number;
}

export interface UserMetrics {
  upcoming_income_30d: number;
  upcoming_essential_30d: number;
  min_buffer_90d: number;
  lowest_projected_balance: number;
  is_currently_safe: boolean;
}

export interface ScenarioResult {
  scenario_name: string;
  method: string;
  is_safe: boolean;
  is_accepted_by_user: boolean;
  completed_by_deadline: boolean;
  requires_spending_changes: boolean;
  spending_changes: string;
  total_amount_paid: number;
  first_payment_date: string;
  final_payment_date: string;
  lowest_projected_balance: number;
  payment_plan: string;
  payment_option_id?: string | null;
  rejection_reason?: string | null;
}

export interface ChartDataPoint {
  date: string;
  day_offset: number;
  balance: number;
  min_balance: number;
  income: number;
  expenses: number;
  is_safe: boolean;
  events_count: number;
}

export interface EvaluationData {
  request_id: string;
  user_id: string;
  user_name: string;
  home_currency: string;
  purchase_description: string;
  requested_amount: number;
  currency: string;
  amount_safe_to_pay: number;
  affordability_status: 'affordable_now' | 'affordable_with_plan' | 'affordable_later' | 'not_affordable';
  recommended_payment_method: 'full_payment' | 'partial_payment' | 'installments' | 'wait' | 'not_recommended';
  payment_plan: string;
  earliest_date_for_full_payment: string;
  spending_changes_needed: string;
  decision_explanation: string;
  desired_completion_date: string;
}

export interface EvaluationResponse {
  evaluation: EvaluationData;
  scenarios: ScenarioResult[];
  chart_data: ChartDataPoint[];
}

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  status: string;
  is_essential: boolean;
  is_flexible: boolean;
  description: string;
}

export interface AdminData {
  financial_profiles: Record<string, string>[];
  financial_events: Record<string, string>[];
  exchange_rates: Record<string, string>[];
  request_payment_options: Record<string, string>[];
  messages: Record<string, string>[];
  images: Record<string, string>[];
  requests: Record<string, string>[];
  output: Record<string, string>[];
  ocr_extractions: {
    image_id: string;
    related_event_id: string;
    file_path: string;
    description: string;
    extracted_amount: number | null;
    extraction_method: string;
  }[];
}
