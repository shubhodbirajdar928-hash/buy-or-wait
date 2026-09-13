import React, { useState, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Clock, XCircle, ShieldCheck, ArrowRight, Layers, Info, TrendingUp, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { EvaluationResponse } from '../types';
import { Disclaimer } from '../components/Disclaimer';

interface RecommendationProps {
  data: EvaluationResponse | null;
  onNavigateToScenarios: () => void;
  onNavigateToAsk: () => void;
}

const fmt = (n: number, d = 0) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const statusTheme = {
  affordable_now: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', icon: CheckCircle2, headline: 'Safe to Pay Today', badge: 'Affordable Now' },
  affordable_with_plan: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: AlertTriangle, headline: 'Affordable with a Payment Plan', badge: 'Plan Recommended' },
  affordable_later: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', icon: Clock, headline: 'Wait for Next Income Date', badge: 'Affordable Later' },
  not_affordable: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', icon: XCircle, headline: 'Not Recommended (Protects Savings)', badge: 'Risk of Breach' },
};

// Simplified friendly Tooltip
const FriendlyTooltip = ({ active, payload, label, curr }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const safeBuffer = Math.round(d.balance - d.min_balance);
  const isSafe = safeBuffer >= 0;

  return (
    <div className="rounded-xl p-3.5 text-xs shadow-2xl backdrop-blur-md" 
         style={{ background: 'rgba(12,18,34,0.96)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <div className="text-slate-400 font-semibold mb-2 flex items-center justify-between gap-4">
        <span>📅 {label}</span>
        <span className="text-[10px] text-slate-500 font-mono">Day +{d.day_offset}</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">Projected Balance:</span>
          <span className="font-mono font-bold text-white">{curr} {fmt(d.balance)}</span>
        </div>

        <div className="flex justify-between gap-6">
          <span className="text-slate-400">Emergency Reserve:</span>
          <span className="font-mono text-rose-400">{curr} {fmt(d.min_balance)}</span>
        </div>

        <div className="pt-1.5 border-t border-white/10 flex justify-between gap-6">
          <span className="text-slate-300 font-medium">Safe Cushion:</span>
          <span className={`font-mono font-bold ${isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isSafe ? '+' : ''}{curr} {fmt(safeBuffer)}
          </span>
        </div>

        {d.income > 0 && (
          <div className="text-[11px] text-emerald-400 pt-0.5">
            💰 +{curr} {fmt(d.income)} income received
          </div>
        )}
      </div>
    </div>
  );
};

export const Recommendation: React.FC<RecommendationProps> = ({ data, onNavigateToScenarios, onNavigateToAsk }) => {
  // Time span selector state (14 days, 30 days, or 90 days)
  const [timeHorizon, setTimeHorizon] = useState<14 | 30 | 90>(30);

  if (!data) return (
    <div className="glass rounded-2xl p-16 text-center space-y-5">
      <Info className="w-14 h-14 mx-auto text-slate-600" />
      <div>
        <h3 className="text-lg font-bold text-slate-200">No Decision Selected</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          Select a purchase from the dashboard to view the affordability recommendation.
        </p>
      </div>
      <button onClick={onNavigateToAsk} className="btn-primary mx-auto">
        Test a Purchase <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const { evaluation, chart_data } = data;
  const status = evaluation.affordability_status as keyof typeof statusTheme;
  const theme = statusTheme[status] || statusTheme.not_affordable;
  const StatusIcon = theme.icon;
  const curr = evaluation.home_currency;

  // Filter chart data by selected time horizon
  const visibleChartData = useMemo(() => {
    return chart_data.slice(0, timeHorizon + 1);
  }, [chart_data, timeHorizon]);

  // Compute key highlights for friendly summary
  const minBalVal = chart_data.length > 0 ? chart_data[0].min_balance : 1500;
  const lowestPointInView = Math.min(...visibleChartData.map(d => d.balance));
  const highestPointInView = Math.max(...visibleChartData.map(d => d.balance));
  const minBuffer = lowestPointInView - minBalVal;
  const staysCompletelySafe = minBuffer >= 0;

  const planItems = (evaluation.payment_plan && evaluation.payment_plan !== 'none')
    ? evaluation.payment_plan.split('|').map((p, i) => { 
        const [d, a] = p.split(':'); 
        return { i: i + 1, date: d, amount: parseFloat(a) }; 
      })
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Main Clear Decision Card */}
      <div className="rounded-2xl p-6 sm:p-8" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" 
                 style={{ background: `${theme.color}20`, border: `1px solid ${theme.color}40` }}>
              <StatusIcon className="w-7 h-7" style={{ color: theme.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" 
                      style={{ background: `${theme.color}20`, color: theme.color, border: `1px solid ${theme.color}30` }}>
                  {theme.badge}
                </span>
                <span className="text-xs text-slate-500 font-mono">{evaluation.request_id}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{theme.headline}</h2>
              <p className="text-sm text-slate-300 mt-1">
                Target: <span className="font-bold text-white">{evaluation.purchase_description}</span> —{' '}
                <span className="font-mono font-bold" style={{ color: theme.color }}>{curr} {fmt(evaluation.requested_amount, 2)}</span>
              </p>
            </div>
          </div>

          <button onClick={onNavigateToScenarios} className="btn-ghost flex-shrink-0">
            Compare 5 Scenarios <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Clean Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-4 rounded-xl bg-black/25 border border-white/5">
            <div className="text-[11px] uppercase font-semibold text-slate-400">Safe Today</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
              {curr} {fmt(evaluation.amount_safe_to_pay, 2)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Without touching reserves</div>
          </div>

          <div className="p-4 rounded-xl bg-black/25 border border-white/5">
            <div className="text-[11px] uppercase font-semibold text-slate-400">Earliest Full Payment</div>
            <div className="text-base font-bold text-slate-100 font-mono mt-1">
              {evaluation.earliest_date_for_full_payment || 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">When income arrives</div>
          </div>

          <div className="p-4 rounded-xl bg-black/25 border border-white/5">
            <div className="text-[11px] uppercase font-semibold text-slate-400">Recommended Plan</div>
            <div className="text-base font-bold text-slate-100 capitalize mt-1 truncate">
              {evaluation.recommended_payment_method.replace(/_/g, ' ')}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Safest route</div>
          </div>

          <div className="p-4 rounded-xl bg-black/25 border border-white/5">
            <div className="text-[11px] uppercase font-semibold text-slate-400">Budget Changes</div>
            <div className="text-base font-bold text-slate-100 mt-1 truncate">
              {evaluation.spending_changes_needed === 'none' ? 'None Needed ✓' : 'Minor Cut'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Flexible expenses</div>
          </div>
        </div>

        {/* Natural Language Explanation */}
        <div className="mt-6 p-4 rounded-xl bg-black/25 border border-white/5">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Why this is recommended
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            {evaluation.decision_explanation}
          </p>
        </div>

        {/* Optional installment list */}
        {planItems.length > 0 && (
          <div className="mt-6 rounded-xl overflow-hidden border border-white/10">
            <div className="px-4 py-2.5 bg-black/40 border-b border-white/10 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Payment Breakdown ({planItems.length} steps)</span>
              <span className="text-slate-400">Target Date: <strong className="text-white">{evaluation.desired_completion_date}</strong></span>
            </div>
            <div className="divide-y divide-white/5 bg-black/20 text-xs">
              {planItems.map(item => (
                <div key={item.i} className="px-4 py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px]">{item.i}</span>
                    <span className="text-slate-300 font-mono">{item.date}</span>
                  </div>
                  <div className="font-mono font-bold text-emerald-400">
                    {curr} {fmt(item.amount, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. SIMPLIFIED & INTUITIVE BALANCE GRAPH */}
      <div className="glass rounded-2xl p-6 space-y-4">
        {/* Graph Header with Time Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">Projected Bank Balance</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Simulation
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Shows how your bank balance moves. As long as it stays above the red line, you are safe.
            </p>
          </div>

          {/* Clean 14d / 30d / 90d buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
            {([14, 30, 90] as const).map((days) => (
              <button
                key={days}
                onClick={() => setTimeHorizon(days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeHorizon === days
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {days === 90 ? '90 Days' : `${days} Days`}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Quick Visual Status Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Safety Status</div>
              <div className={`text-xs font-bold ${staysCompletelySafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                {staysCompletelySafe ? '✓ Never Breaches Reserve' : '⚠ Reserve at Risk'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Lowest Balance In Range</div>
              <div className="text-xs font-bold text-slate-200 font-mono">
                {curr} {fmt(lowestPointInView)}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Untouchable Floor</div>
              <div className="text-xs font-bold text-rose-400 font-mono">
                {curr} {fmt(minBalVal)}
              </div>
            </div>
          </div>
        </div>

        {/* The Cleaned-Up Chart */}
        <div style={{ height: '280px', width: '100%', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visibleChartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
              <defs>
                {/* Soft gradient for smooth look */}
                <linearGradient id="cleanGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />

              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickFormatter={(v) => v.slice(5)} // Show MM-DD only
                interval={timeHorizon === 14 ? 2 : timeHorizon === 30 ? 4 : 12}
                axisLine={false} 
                tickLine={false} 
              />

              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} 
                axisLine={false} 
                tickLine={false} 
              />

              <Tooltip content={<FriendlyTooltip curr={curr} />} />

              {/* Clear Red Floor Line */}
              <ReferenceLine 
                y={minBalVal} 
                stroke="#f43f5e" 
                strokeDasharray="4 4" 
                strokeWidth={2}
                label={{ 
                  value: `🛑 Safety Limit (${curr} ${fmt(minBalVal)})`, 
                  fill: '#f43f5e', 
                  fontSize: 10, 
                  position: 'insideTopLeft' 
                }} 
              />

              {/* Balance Curve */}
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#cleanGreenGrad)" 
                dot={false}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500/80 inline-block" />
            <span>Your Projected Balance (Safe Zone)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-b-2 border-dashed border-rose-500 inline-block" />
            <span className="text-rose-400">Untouchable Minimum Reserve</span>
          </div>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
};
