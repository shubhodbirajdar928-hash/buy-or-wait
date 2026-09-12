import { UserProfile, EvaluationResponse, TimelineItem, AdminData } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// Fallback Mock Datasets
const MOCK_USERS: UserProfile[] = [
  {
    user_id: 'USR_001',
    name: 'Alex Rivera',
    home_currency: 'USD',
    current_balance: 3200.0,
    minimum_balance_to_keep: 1500.0,
    accepted_payment_methods: ['full_payment', 'partial_payment', 'installments'],
    financial_priorities: 'safety_first,essential_coverage',
    willingness_to_reduce_flexible_spending: true,
    request_count: 3
  },
  {
    user_id: 'USR_002',
    name: 'Priya Sharma',
    home_currency: 'INR',
    current_balance: 98000.0,
    minimum_balance_to_keep: 35000.0,
    accepted_payment_methods: ['full_payment', 'partial_payment', 'installments'],
    financial_priorities: 'minimize_debt,avoid_fees',
    willingness_to_reduce_flexible_spending: true,
    request_count: 2
  },
  {
    user_id: 'USR_003',
    name: 'Marco Rossi',
    home_currency: 'EUR',
    current_balance: 2200.0,
    minimum_balance_to_keep: 1200.0,
    accepted_payment_methods: ['full_payment', 'wait'],
    financial_priorities: 'maintain_liquidity,no_installments',
    willingness_to_reduce_flexible_spending: false,
    request_count: 1
  },
  {
    user_id: 'USR_004',
    name: 'Emma Watson',
    home_currency: 'GBP',
    current_balance: 4500.0,
    minimum_balance_to_keep: 1500.0,
    accepted_payment_methods: ['full_payment', 'partial_payment'],
    financial_priorities: 'budget_strictness,save_buffer',
    willingness_to_reduce_flexible_spending: true,
    request_count: 1
  },
  {
    user_id: 'USR_005',
    name: 'David Kim',
    home_currency: 'USD',
    current_balance: 1800.0,
    minimum_balance_to_keep: 1000.0,
    accepted_payment_methods: ['full_payment', 'partial_payment', 'installments'],
    financial_priorities: 'emergency_preparedness',
    willingness_to_reduce_flexible_spending: false,
    request_count: 1
  }
];

export async function fetchUsers(): Promise<UserProfile[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/users`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    console.warn('Using local fallback users data');
    return MOCK_USERS;
  }
}

export async function fetchUserDetail(userId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    const u = MOCK_USERS.find(user => user.user_id === userId) || MOCK_USERS[0];
    return {
      profile: u,
      metrics: {
        upcoming_income_30d: 4800.0,
        upcoming_essential_30d: 1980.0,
        min_buffer_90d: 1700.0,
        lowest_projected_balance: 3200.0,
        is_currently_safe: true
      },
      requests: [
        {
          request_id: 'REQ_001',
          purchase_description: 'Workstation Laptop M3',
          requested_amount: 850.0,
          currency: u.home_currency,
          request_date: '2026-09-12',
          desired_completion_date: '2026-10-15',
          affordability_status: 'affordable_now',
          recommended_payment_method: 'full_payment',
          amount_safe_to_pay: 850.0,
          payment_plan: '2026-09-12:850.00',
          earliest_date_for_full_payment: '2026-09-12',
          spending_changes_needed: 'none',
          decision_explanation: `You can safely pay the full ${u.home_currency} 850.00 today. Your projected balance remains well above your ${u.home_currency} ${u.minimum_balance_to_keep} reserve.`
        }
      ]
    };
  }
}

export async function fetchRequests() {
  try {
    const res = await fetch(`${API_BASE_URL}/requests`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return [
      {
        request_id: 'REQ_001',
        user_id: 'USR_001',
        user_name: 'Alex Rivera',
        request_date: '2026-09-12',
        purchase_description: 'Workstation Laptop M3',
        requested_amount: 850.0,
        currency: 'USD',
        desired_completion_date: '2026-10-15',
        request_type: 'equipment',
        allows_partial_payment: true,
        affordability_status: 'affordable_now',
        recommended_payment_method: 'full_payment',
        amount_safe_to_pay: 850.0,
        earliest_date_for_full_payment: '2026-09-12'
      },
      {
        request_id: 'REQ_002',
        user_id: 'USR_001',
        user_name: 'Alex Rivera',
        request_date: '2026-09-12',
        purchase_description: 'Studio Camera & Production Rig',
        requested_amount: 2200.0,
        currency: 'USD',
        desired_completion_date: '2026-10-15',
        request_type: 'equipment',
        allows_partial_payment: true,
        affordability_status: 'affordable_with_plan',
        recommended_payment_method: 'partial_payment',
        amount_safe_to_pay: 1700.0,
        earliest_date_for_full_payment: '2026-09-15'
      },
      {
        request_id: 'REQ_003',
        user_id: 'USR_002',
        user_name: 'Priya Sharma',
        request_date: '2026-09-12',
        purchase_description: 'Executive Tech Leadership Course',
        requested_amount: 60000.0,
        currency: 'INR',
        desired_completion_date: '2026-12-10',
        request_type: 'education',
        allows_partial_payment: false,
        affordability_status: 'affordable_with_plan',
        recommended_payment_method: 'installments',
        amount_safe_to_pay: 20880.0,
        earliest_date_for_full_payment: '2026-09-30'
      },
      {
        request_id: 'REQ_004',
        user_id: 'USR_003',
        user_name: 'Marco Rossi',
        request_date: '2026-09-12',
        purchase_description: 'Vehicle Transmission Repair',
        requested_amount: 2500.0,
        currency: 'EUR',
        desired_completion_date: '2026-10-10',
        request_type: 'auto_repair',
        allows_partial_payment: false,
        affordability_status: 'affordable_later',
        recommended_payment_method: 'wait',
        amount_safe_to_pay: 1000.0,
        earliest_date_for_full_payment: '2026-09-25'
      },
      {
        request_id: 'REQ_006',
        user_id: 'USR_005',
        user_name: 'David Kim',
        request_date: '2026-09-12',
        purchase_description: 'Luxury Gold Chronograph',
        requested_amount: 5000.0,
        currency: 'USD',
        desired_completion_date: '2026-10-30',
        request_type: 'luxury',
        allows_partial_payment: true,
        affordability_status: 'not_affordable',
        recommended_payment_method: 'not_recommended',
        amount_safe_to_pay: 650.0,
        earliest_date_for_full_payment: ''
      }
    ];
  }
}

export async function fetchEvaluation(requestId: string): Promise<EvaluationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/evaluate/${requestId}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    // Generate synthetic 90-day curve
    const chart = [];
    const base = 3200;
    const minBal = 1500;
    for (let i = 0; i <= 90; i++) {
      const dt = new Date(2026, 8, 12);
      dt.setDate(dt.getDate() + i);
      const isPay = (i % 14 === 3);
      const isExp = (i % 30 === 18);
      const bal = base + (isPay ? 2400 : 0) - (isExp ? 1600 : 0);
      chart.push({
        date: dt.toISOString().split('T')[0],
        day_offset: i,
        balance: bal,
        min_balance: minBal,
        income: isPay ? 2400 : 0,
        expenses: isExp ? 1600 : 0,
        is_safe: bal >= minBal,
        events_count: (isPay ? 1 : 0) + (isExp ? 1 : 0)
      });
    }

    return {
      evaluation: {
        request_id: requestId,
        user_id: 'USR_001',
        user_name: 'Alex Rivera',
        home_currency: 'USD',
        purchase_description: 'Workstation Laptop M3',
        requested_amount: 850.0,
        currency: 'USD',
        amount_safe_to_pay: 850.0,
        affordability_status: 'affordable_now',
        recommended_payment_method: 'full_payment',
        payment_plan: '2026-09-12:850.00',
        earliest_date_for_full_payment: '2026-09-12',
        spending_changes_needed: 'none',
        decision_explanation: 'You can safely pay the full USD 850.00 today. Your current balance is USD 3200.00 and projected buffer remains above USD 1500.00 across all 90 days.',
        desired_completion_date: '2026-10-15'
      },
      scenarios: [
        {
          scenario_name: 'Pay in Full Today',
          method: 'full_payment',
          is_safe: true,
          is_accepted_by_user: true,
          completed_by_deadline: true,
          requires_spending_changes: false,
          spending_changes: 'none',
          total_amount_paid: 850.0,
          first_payment_date: '2026-09-12',
          final_payment_date: '2026-09-12',
          lowest_projected_balance: 2350.0,
          payment_plan: '2026-09-12:850.00',
          rejection_reason: null
        },
        {
          scenario_name: 'Installment Plan (OPT_001)',
          method: 'installments',
          is_safe: true,
          is_accepted_by_user: true,
          completed_by_deadline: true,
          requires_spending_changes: false,
          spending_changes: 'none',
          total_amount_paid: 865.0,
          first_payment_date: '2026-09-12',
          final_payment_date: '2026-11-11',
          lowest_projected_balance: 2911.67,
          payment_plan: '2026-09-12:288.33|2026-10-12:288.33|2026-11-11:288.34',
          rejection_reason: null
        }
      ],
      chart_data: chart
    };
  }
}

export async function submitCustomEvaluation(data: any): Promise<EvaluationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return fetchEvaluation('REQ_CUSTOM');
  }
}

export async function fetchTimeline(userId: string): Promise<TimelineItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/timeline/${userId}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return [
      {
        id: 'INIT_BAL',
        date: '2026-09-12',
        title: 'Starting Available Balance',
        category: 'Balance',
        amount: 3200.0,
        currency: 'USD',
        status: 'Confirmed',
        is_essential: true,
        is_flexible: false,
        description: 'Verified initial liquid reserves'
      },
      {
        id: 'EVT_001',
        date: '2026-09-15',
        title: 'Bi-weekly Salary Deposit',
        category: 'Recurring Income',
        amount: 2400.0,
        currency: 'USD',
        status: 'Confirmed',
        is_essential: false,
        is_flexible: false,
        description: 'Direct deposit payroll'
      },
      {
        id: 'EVT_005',
        date: '2026-09-20',
        title: 'Metro Electricity & Power Bill',
        category: 'Essential Expense',
        amount: 250.0,
        currency: 'USD',
        status: 'Confirmed',
        is_essential: true,
        is_flexible: false,
        description: 'OCR Extracted from Invoice | Monthly Residential Electricity Usage'
      },
      {
        id: 'EVT_008',
        date: '2026-09-18',
        title: 'Expected Cashback Rebate',
        category: 'Pending Credit',
        amount: 150.0,
        currency: 'USD',
        status: 'Ignored (Pending)',
        is_essential: false,
        is_flexible: false,
        description: 'Unconfirmed credit, safely omitted from spendable cash'
      }
    ];
  }
}

export async function fetchAdminData(): Promise<AdminData> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/data`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return {
      financial_profiles: [],
      financial_events: [],
      exchange_rates: [],
      request_payment_options: [],
      messages: [],
      images: [],
      requests: [],
      output: [],
      ocr_extractions: []
    };
  }
}

export async function triggerBatchRegeneration() {
  const res = await fetch(`${API_BASE_URL}/admin/generate`, { method: 'POST' });
  if (!res.ok) throw new Error('Regeneration failed');
  return await res.json();
}
