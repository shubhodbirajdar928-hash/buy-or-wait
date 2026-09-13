import React, { useEffect, useState } from 'react';
import { Wallet, ShieldAlert, TrendingUp, Calendar, CheckCircle2, Clock, XCircle, AlertTriangle, Sparkles, ChevronRight, BarChart3, ArrowUpRight } from 'lucide-react';
import { UserProfile, UserMetrics } from '../types';
import { fetchUserDetail } from '../services/api';
import { Disclaimer } from '../components/Disclaimer';

interface DashboardProps {
  selectedUser: UserProfile | null;
  onSelectRequest: (requestId: string) => void;
  onNavigateToAsk: () => void;
}

const fmt = (n: number, dec = 2) => n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });

const statusConfig = {
  affordable_now: { label: 'Affordable Now', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', icon: CheckCircle2 },
  affordable_with_plan: { label: 'Affordable w/ Plan', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: AlertTriangle },
  affordable_later: { label: 'Affordable Later', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', icon: Clock },
  not_affordable: { label: 'Not Affordable', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', icon: XCircle },
};

export const Dashboard: React.FC<DashboardProps> = ({ selectedUser, onSelectRequest, onNavigateToAsk }) => {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedUser) {
      setLoading(true);
      fetchUserDetail(selectedUser.user_id).then(d => { setMetrics(d.metrics); setRequests(d.requests); }).finally(() => setLoading(false));
    }
  }, [selectedUser]);

  if (!selectedUser) return (
    <div className="flex items-center justify-center min-h-64 text-slate-500">Select a profile to view dashboard.</div>
  );

  const curr = selectedUser.home_currency;
  const bufferAmt = Math.max(0, selectedUser.current_balance - selectedUser.minimum_balance_to_keep);
  const bufferPct = Math.min(100, Math.round((bufferAmt / selectedUser.current_balance) * 100));

  let safeLabel = 'Safe', safeColor = '#10b981', safeBg = 'rgba(16,185,129,0.08)', safeBorder = 'rgba(16,185,129,0.18)';
  let safeDesc = 'Your projected cash buffer safely covers all essential expenses and your minimum reserve over 90 days.';
  if (metrics && !metrics.is_currently_safe) {
    safeLabel = 'Critical Breach'; safeColor = '#ef4444'; safeBg = 'rgba(239,68,68,0.08)'; safeBorder = 'rgba(239,68,68,0.18)';
    safeDesc = 'Baseline expenses exceed balance before next income. Minimum reserve breached.';
  } else if (metrics && metrics.min_buffer_90d < 500) {
    safeLabel = 'Caution'; safeColor = '#f59e0b'; safeBg = 'rgba(245,158,11,0.08)'; safeBorder = 'rgba(245,158,11,0.18)';
    safeDesc = 'Reserves remain safe, but cash buffer drops near minimum threshold during peak bill dates.';
  }

  const metricCards = [
    { label: 'Available Balance', value: `${curr} ${fmt(selectedUser.current_balance)}`, sub: `${bufferPct}% uncommitted buffer`, icon: Wallet, color: '#0ea5e9' },
    { label: 'Minimum Reserve', value: `${curr} ${fmt(selectedUser.minimum_balance_to_keep)}`, sub: 'Guaranteed floor', icon: ShieldAlert, color: '#8b5cf6' },
    { label: 'Confirmed 30d Income', value: `+${curr} ${metrics ? fmt(metrics.upcoming_income_30d) : '—'}`, sub: 'Verified payroll streams', icon: TrendingUp, color: '#10b981', positive: true },
    { label: 'Essential Commitments', value: `-${curr} ${metrics ? fmt(metrics.upcoming_essential_30d) : '—'}`, sub: 'Rent, utilities, medical', icon: Calendar, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(14,165,233,0.08) 50%, rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(16,185,129,0.18)' }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(16,185,129,0.15) 0%, transparent 50%)' }} />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">Personal Affordability Hub</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="gradient-text-green">{selectedUser.name}</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-lg">
              Simulating your liquidity across a strict <span className="text-slate-300 font-semibold">90-day horizon</span> to ensure every purchase decision is backed by verified cash flow.
            </p>
          </div>
          <button onClick={onNavigateToAsk} className="btn-primary flex-shrink-0">
            <Sparkles className="w-4 h-4" /> Ask Buy or Wait
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <div key={i} className="glass rounded-2xl p-5 transition-all hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
                <div className={`text-xl font-extrabold mt-1.5 font-mono tracking-tight ${card.positive ? 'text-emerald-400' : 'text-slate-100'}`}>{loading && i > 1 ? '...' : card.value}</div>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ml-3" style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}>
                <card.icon className="w-4.5 h-4.5" style={{ color: card.color, width: '18px', height: '18px' }} />
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-3">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Safety + Preferences row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Safety card */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: safeBg, border: `1px solid ${safeBorder}` }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Financial Safety Status</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${safeColor}20`, color: safeColor, border: `1px solid ${safeColor}40` }}>{safeLabel}</span>
          </div>
          <div className="text-slate-100 font-bold text-lg">
            90-Day Liquidity Buffer: <span className="font-mono" style={{ color: safeColor }}>{curr} {metrics ? fmt(metrics.min_buffer_90d) : '...'}</span>
          </div>
          <p className="text-slate-400 text-sm mt-2">{safeDesc}</p>
          <div className="mt-5 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <div className="text-slate-500">Lowest 90d Point</div>
              <div className="font-mono font-semibold text-slate-200 mt-0.5">{curr} {metrics ? metrics.lowest_projected_balance.toLocaleString() : '...'}</div>
            </div>
            <div>
              <div className="text-slate-500">Flexible Spending</div>
              <div className="font-semibold text-slate-200 mt-0.5">{selectedUser.willingness_to_reduce_flexible_spending ? 'Adjustable ✓' : 'Fixed Only'}</div>
            </div>
            <div>
              <div className="text-slate-500">Accepted Methods</div>
              <div className="font-semibold text-slate-200 mt-0.5 truncate">{selectedUser.accepted_payment_methods.join(', ').replace(/_/g, ' ')}</div>
            </div>
          </div>
        </div>

        {/* Profile card */}
        <div className="glass rounded-2xl p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Risk Profile</div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: 'linear-gradient(135deg,#10b981,#0284c7)', color: '#fff' }}>
              {selectedUser.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-slate-100">{selectedUser.name}</div>
              <div className="text-xs text-slate-500 font-mono">{selectedUser.home_currency} · {selectedUser.user_id}</div>
            </div>
          </div>
          <div className="space-y-2.5 text-xs">
            {[
              { k: 'Priority', v: selectedUser.financial_priorities.replace(/_/g, ' ').replace(/,/g, ', ') },
              { k: 'Reserve Ratio', v: `${Math.round((selectedUser.minimum_balance_to_keep / selectedUser.current_balance) * 100)}% of balance` },
              { k: 'Currency', v: selectedUser.home_currency },
            ].map(({ k, v }) => (
              <div key={k} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-slate-500">{k}</span>
                <span className="font-semibold text-slate-300 text-right max-w-[60%] truncate">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[11px] text-slate-600">Rules strictly enforced by deterministic engine.</div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="font-bold text-slate-100">Recent Affordability Decisions</h3>
            <p className="text-xs text-slate-500 mt-0.5">AI-evaluated via 90-day deterministic cash flow simulation</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>{requests.length} Requests</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">{[1,2].map(i => <div key={i} className="shimmer h-12 rounded-xl" />)}</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No requests yet. Click <span className="text-emerald-400">"Ask Buy or Wait"</span> to test a purchase.</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left dark-table">
              <thead>
                <tr>
                  <th>Purchase Request</th><th>Amount</th><th>Safe to Pay</th><th>Status</th><th>Method</th><th>Deadline</th><th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const cfg = statusConfig[req.affordability_status as keyof typeof statusConfig] || statusConfig.not_affordable;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={req.request_id} style={{ cursor: 'pointer' }} onClick={() => onSelectRequest(req.request_id)}>
                      <td>
                        <div className="font-semibold text-slate-200">{req.purchase_description}</div>
                        <div className="text-[11px] text-slate-600 font-mono">{req.request_id}</div>
                      </td>
                      <td className="font-mono font-semibold text-slate-200">{curr} {fmt(req.requested_amount)}</td>
                      <td className="font-mono text-emerald-400">{curr} {fmt(req.amount_safe_to_pay)}</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          <StatusIcon className="w-3 h-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="text-slate-400 capitalize text-xs">{req.recommended_payment_method?.replace(/_/g, ' ')}</td>
                      <td className="text-slate-500 text-xs font-mono">{req.desired_completion_date}</td>
                      <td className="text-right">
                        <button onClick={e => { e.stopPropagation(); onSelectRequest(req.request_id); }}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Disclaimer />
    </div>
  );
};
