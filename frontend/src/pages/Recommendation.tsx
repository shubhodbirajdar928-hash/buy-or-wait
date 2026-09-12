import React from 'react';
import { 
  CheckCircle2, AlertTriangle, Clock, XCircle, Calendar, 
  Wallet, ShieldCheck, ArrowRight, DollarSign, Layers, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, 
  XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Legend 
} from 'recharts';
import { EvaluationResponse } from '../types';
import { Disclaimer } from '../components/Disclaimer';

interface RecommendationProps {
  data: EvaluationResponse | null;
  onNavigateToScenarios: () => void;
  onNavigateToAsk: () => void;
}

export const Recommendation: React.FC<RecommendationProps> = ({
  data,
  onNavigateToScenarios,
  onNavigateToAsk
}) => {
  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
        <Info className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Active Recommendation Selected</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Please select a purchase from your recent decisions list or submit a new inquiry in "Ask Buy or Wait".
        </p>
        <button
          onClick={onNavigateToAsk}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
        >
          Submit a Purchase Inquiry
        </button>
      </div>
    );
  }

  const { evaluation, chart_data } = data;
  const status = evaluation.affordability_status;
  const method = evaluation.recommended_payment_method;
  const curr = evaluation.home_currency;

  // Visual theming based on affordability status
  let theme = {
    bg: 'bg-emerald-50 border-emerald-300',
    headerBg: 'bg-emerald-600',
    titleColor: 'text-emerald-900',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
    headline: 'Affordable Now — Safe to Pay in Full Today'
  };

  if (status === 'affordable_with_plan') {
    theme = {
      bg: 'bg-amber-50/80 border-amber-300',
      headerBg: 'bg-amber-600',
      titleColor: 'text-amber-900',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
      headline: method === 'partial_payment' 
        ? 'Affordable with Partial Payment Plan' 
        : 'Affordable with Scheduled Installment Plan'
    };
  } else if (status === 'affordable_later') {
    theme = {
      bg: 'bg-orange-50/80 border-orange-300',
      headerBg: 'bg-orange-600',
      titleColor: 'text-orange-900',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: <Clock className="w-8 h-8 text-orange-600" />,
      headline: `Wait until ${evaluation.earliest_date_for_full_payment}`
    };
  } else if (status === 'not_affordable') {
    theme = {
      bg: 'bg-rose-50/80 border-rose-300',
      headerBg: 'bg-rose-600',
      titleColor: 'text-rose-900',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: <XCircle className="w-8 h-8 text-rose-600" />,
      headline: 'Not Recommended — Protect Essential Reserves'
    };
  }

  // Parse payment plan into table items
  const planItems = (evaluation.payment_plan && evaluation.payment_plan !== 'none')
    ? evaluation.payment_plan.split('|').map((p, idx) => {
        const [d, a] = p.split(':');
        return { index: idx + 1, date: d, amount: parseFloat(a) };
      })
    : [];

  const minBalVal = chart_data.length > 0 ? chart_data[0].min_balance : 1500;

  return (
    <div className="space-y-6">
      {/* Prominent Decision Card */}
      <div className={`rounded-2xl border-2 shadow-lg overflow-hidden bg-white ${theme.bg}`}>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                {theme.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badgeBg}`}>
                    {status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ID: {evaluation.request_id}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {theme.headline}
                </h2>
                <p className="text-sm font-medium text-slate-600">
                  Target: <span className="text-slate-900 font-bold">{evaluation.purchase_description}</span> — {curr} {evaluation.requested_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToScenarios}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              Compare All Scenarios
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Key Facts Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/80 p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <span className="text-[11px] uppercase font-semibold text-slate-500">Safe to Pay Today</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                {curr} {evaluation.amount_safe_to_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400">Largest immediate buffer</span>
            </div>

            <div className="bg-white/80 p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <span className="text-[11px] uppercase font-semibold text-slate-500">Earliest Full Payment</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                {evaluation.earliest_date_for_full_payment || 'N/A'}
              </div>
              <span className="text-[10px] text-slate-400">Based on confirmed income</span>
            </div>

            <div className="bg-white/80 p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <span className="text-[11px] uppercase font-semibold text-slate-500">Payment Method</span>
              <div className="text-base font-bold text-slate-900 capitalize mt-1 truncate">
                {evaluation.recommended_payment_method.replace(/_/g, ' ')}
              </div>
              <span className="text-[10px] text-slate-400">Ranked highest by safety</span>
            </div>

            <div className="bg-white/80 p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <span className="text-[11px] uppercase font-semibold text-slate-500">Spending Changes</span>
              <div className="text-base font-bold text-slate-900 mt-1 truncate">
                {evaluation.spending_changes_needed === 'none' ? 'None Needed' : evaluation.spending_changes_needed}
              </div>
              <span className="text-[10px] text-slate-400">Flexible expenses only</span>
            </div>
          </div>

          {/* Concrete Decision Explanation */}
          <div className="mt-6 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Factual Rationale & Analysis
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed mt-2 font-medium">
              {evaluation.decision_explanation}
            </p>
          </div>

          {/* Payment Plan Schedule Table */}
          {planItems.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Recommended Payment Schedule ({planItems.length} {planItems.length === 1 ? 'Payment' : 'Installments'})
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Deadline: <strong>{evaluation.desired_completion_date}</strong>
                </span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-2.5">#</th>
                    <th className="px-5 py-2.5">Scheduled Date</th>
                    <th className="px-5 py-2.5">Payment Amount</th>
                    <th className="px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {planItems.map((item) => (
                    <tr key={item.index} className="hover:bg-slate-50">
                      <td className="px-5 py-2.5 font-bold text-slate-400">{item.index}</td>
                      <td className="px-5 py-2.5 font-mono text-slate-900 font-semibold">{item.date}</td>
                      <td className="px-5 py-2.5 font-mono text-slate-900 font-bold">
                        {curr} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                          Confirmed Safe
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 90-Day Balance Forecast Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              90-Day Projected Cash Balance Horizon
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulating daily liquidity incorporating confirmed payroll, rent, utilities, and scheduled payments.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span className="text-slate-600">Projected Balance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b-2 border-dashed border-rose-500 inline-block" />
              <span className="text-slate-600 font-semibold">Min Reserve ({curr} {minBalVal.toLocaleString()})</span>
            </div>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart_data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickFormatter={(val) => val.slice(5)} 
                interval={10} 
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }}
                domain={['auto', 'auto']}
                tickFormatter={(val) => `${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    const buffer = d.balance - d.min_balance;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label} (Day +{d.day_offset})</div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Balance:</span>
                          <span className="font-bold font-mono text-emerald-400">{curr} {d.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Min Reserve:</span>
                          <span className="font-mono text-slate-300">{curr} {d.min_balance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Safety Buffer:</span>
                          <span className={`font-mono font-bold ${buffer >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {buffer >= 0 ? '+' : ''}{curr} {buffer.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {d.income > 0 && (
                          <div className="flex justify-between gap-4 text-emerald-300">
                            <span>Income Inflow:</span>
                            <span className="font-mono">+{curr} {d.income.toLocaleString()}</span>
                          </div>
                        )}
                        {d.expenses > 0 && (
                          <div className="flex justify-between gap-4 text-rose-300">
                            <span>Expense Outflow:</span>
                            <span className="font-mono">-{curr} {d.expenses.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Minimum Balance Reference Line */}
              <ReferenceLine 
                y={minBalVal} 
                stroke="#ef4444" 
                strokeDasharray="4 4" 
                strokeWidth={2}
                label={{ 
                  value: `Min Required Reserve (${curr} ${minBalVal.toLocaleString()})`, 
                  fill: '#ef4444', 
                  fontSize: 11, 
                  position: 'insideTopLeft' 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#10b981" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#balanceGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-slate-400 text-center">
          Hover over dates to view specific daily buffer numbers, income arrivals, and expenditure settlements.
        </p>
      </div>

      {/* Mandatory Disclaimer */}
      <Disclaimer />
    </div>
  );
};
