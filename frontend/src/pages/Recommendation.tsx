import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, XCircle, ShieldCheck, ArrowRight, Layers, Info, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { EvaluationResponse } from '../types';
import { Disclaimer } from '../components/Disclaimer';

interface RecommendationProps {
  data: EvaluationResponse | null;
  onNavigateToScenarios: () => void;
  onNavigateToAsk: () => void;
}

const fmt = (n: number, d = 2) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const statusTheme = {
  affordable_now: { color: '#10b981', glow: 'rgba(16,185,129,0.15)', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.2)', icon: CheckCircle2, headline: 'Affordable Now — Safe to Pay Today', class: 'glow-green' },
  affordable_with_plan: { color: '#f59e0b', glow: 'rgba(245,158,11,0.15)', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)', icon: AlertTriangle, headline: 'Affordable with a Payment Plan', class: 'glow-amber' },
  affordable_later: { color: '#f97316', glow: 'rgba(249,115,22,0.15)', bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.2)', icon: Clock, headline: 'Affordable Later — Wait for Income', class: '' },
  not_affordable: { color: '#ef4444', glow: 'rgba(239,68,68,0.15)', bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.2)', icon: XCircle, headline: 'Not Recommended — Protect Reserves', class: 'glow-red' },
};

const CustomTooltip = ({ active, payload, label, curr }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const buffer = d.balance - d.min_balance;
  return (
    <div className="rounded-xl p-3.5 text-xs space-y-1.5" style={{ background: 'rgba(10,16,30,0.97)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 16px 32px rgba(0,0,0,0.6)' }}>
      <div className="font-bold text-slate-300 pb-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{label} (Day +{d.day_offset})</div>
      <div className="flex justify-between gap-6"><span className="text-slate-500">Balance</span><span className="font-mono font-bold text-emerald-400">{curr} {fmt(d.balance)}</span></div>
      <div className="flex justify-between gap-6"><span className="text-slate-500">Min Reserve</span><span className="font-mono text-slate-400">{curr} {fmt(d.min_balance)}</span></div>
      <div className="flex justify-between gap-6"><span className="text-slate-500">Safety Buffer</span><span className={`font-mono font-bold ${buffer >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{buffer >= 0 ? '+' : ''}{curr} {fmt(buffer)}</span></div>
      {d.income > 0 && <div className="flex justify-between gap-6 text-emerald-400"><span>Income</span><span className="font-mono">+{curr} {fmt(d.income)}</span></div>}
      {d.expenses > 0 && <div className="flex justify-between gap-6 text-red-400"><span>Expenses</span><span className="font-mono">-{curr} {fmt(d.expenses)}</span></div>}
    </div>
  );
};

export const Recommendation: React.FC<RecommendationProps> = ({ data, onNavigateToScenarios, onNavigateToAsk }) => {
  if (!data) return (
    <div className="glass rounded-2xl p-16 text-center space-y-5">
      <Info className="w-14 h-14 mx-auto" style={{ color: '#334155' }} />
      <div>
        <h3 className="text-lg font-bold text-slate-200">No Decision Selected</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">Select a purchase from the dashboard or submit a new inquiry to see your AI-powered affordability recommendation.</p>
      </div>
      <button onClick={onNavigateToAsk} className="btn-primary mx-auto">Submit a Purchase Inquiry <ArrowRight className="w-4 h-4" /></button>
    </div>
  );

  const { evaluation, chart_data } = data;
  const status = evaluation.affordability_status as keyof typeof statusTheme;
  const theme = statusTheme[status] || statusTheme.not_affordable;
  const StatusIcon = theme.icon;
  const curr = evaluation.home_currency;
  const minBalVal = chart_data.length > 0 ? chart_data[0].min_balance : 1500;

  const planItems = (evaluation.payment_plan && evaluation.payment_plan !== 'none')
    ? evaluation.payment_plan.split('|').map((p, i) => { const [d, a] = p.split(':'); return { i: i + 1, date: d, amount: parseFloat(a) }; })
    : [];

  const metrics = [
    { label: 'Safe to Pay Today', value: `${curr} ${fmt(evaluation.amount_safe_to_pay)}`, sub: 'Largest safe buffer' },
    { label: 'Earliest Full Payment', value: evaluation.earliest_date_for_full_payment || 'N/A', sub: 'Based on confirmed income', mono: true },
    { label: 'Recommended Method', value: evaluation.recommended_payment_method.replace(/_/g, ' '), sub: 'Ranked by safety rules' },
    { label: 'Spending Changes', value: evaluation.spending_changes_needed === 'none' ? 'None Needed ✓' : evaluation.spending_changes_needed, sub: 'Flexible expenses only' },
  ];

  return (
    <div className="space-y-6">
      {/* Decision Card */}
      <div className={`rounded-2xl overflow-hidden ${theme.class}`} style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
        <div className="p-6 sm:p-8">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${theme.color}20`, border: `1px solid ${theme.color}40` }}>
                <StatusIcon className="w-7 h-7" style={{ color: theme.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ background: `${theme.color}20`, color: theme.color, border: `1px solid ${theme.color}30` }}>{status.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-slate-600 font-mono">{evaluation.request_id}</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{theme.headline}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  <span className="text-slate-200 font-semibold">{evaluation.purchase_description}</span> — <span className="font-mono" style={{ color: theme.color }}>{curr} {fmt(evaluation.requested_amount)}</span>
                </p>
              </div>
            </div>
            <button onClick={onNavigateToScenarios} className="btn-ghost flex-shrink-0">
              Compare All Scenarios <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Metric tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {metrics.map((m, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-[11px] uppercase font-semibold tracking-wider text-slate-500">{m.label}</div>
                <div className={`text-lg font-extrabold text-slate-100 mt-1.5 ${m.mono ? 'font-mono text-base' : ''}`}>{m.value}</div>
                <div className="text-[10px] text-slate-600 mt-1">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div className="mt-6 p-5 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Factual Rationale</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{evaluation.decision_explanation}</p>
          </div>

          {/* Payment schedule */}
          {planItems.length > 0 && (
            <div className="mt-6 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-3 flex justify-between items-center" style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Schedule ({planItems.length} {planItems.length === 1 ? 'Payment' : 'Installments'})</span>
                <span className="text-xs text-slate-500">Deadline: <strong className="text-slate-300">{evaluation.desired_completion_date}</strong></span>
              </div>
              <table className="w-full dark-table">
                <thead><tr><th>#</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {planItems.map(item => (
                    <tr key={item.i}>
                      <td className="text-slate-600 font-bold font-mono">{item.i}</td>
                      <td className="font-mono text-slate-200 font-semibold">{item.date}</td>
                      <td className="font-mono font-bold" style={{ color: theme.color }}>{curr} {fmt(item.amount)}</td>
                      <td><span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>Confirmed Safe</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 90-Day Chart */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-400" /> 90-Day Projected Balance</h3>
            <p className="text-xs text-slate-500 mt-1">Daily liquidity simulation with confirmed payroll, rent, utilities, and scheduled payments.</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-emerald-400 rounded inline-block" /><span className="text-slate-500">Balance</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-0.5 border-b-2 border-dashed border-red-500 inline-block" /><span className="text-slate-500">Min Reserve</span></div>
          </div>
        </div>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart_data} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#475569' }} tickFormatter={v => v.slice(5)} interval={12} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip curr={curr} />} />
              <ReferenceLine y={minBalVal} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5}
                label={{ value: `Min Reserve (${curr} ${minBalVal.toLocaleString()})`, fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} />
              <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#balGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-slate-600 text-center">Hover over the chart to see daily balance, income arrivals, and expense settlements.</p>
      </div>

      <Disclaimer />
    </div>
  );
};
