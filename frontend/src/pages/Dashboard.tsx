import React, { useEffect, useState } from 'react';
import { 
  Wallet, ShieldAlert, TrendingUp, Calendar, ArrowUpRight, 
  CheckCircle2, Clock, XCircle, AlertTriangle, Sparkles, ChevronRight 
} from 'lucide-react';
import { UserProfile, UserMetrics } from '../types';
import { fetchUserDetail } from '../services/api';
import { Disclaimer } from '../components/Disclaimer';

interface DashboardProps {
  selectedUser: UserProfile | null;
  onSelectRequest: (requestId: string) => void;
  onNavigateToAsk: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedUser,
  onSelectRequest,
  onNavigateToAsk
}) => {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (selectedUser) {
      setLoading(true);
      fetchUserDetail(selectedUser.user_id)
        .then(data => {
          setMetrics(data.metrics);
          setRequests(data.requests);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedUser]);

  if (!selectedUser) {
    return <div className="p-8 text-center text-slate-500">Please select a user to view dashboard.</div>;
  }

  const curr = selectedUser.home_currency;
  const currentBal = selectedUser.current_balance;
  const minBal = selectedUser.minimum_balance_to_keep;
  const bufferAmt = Math.max(0, currentBal - minBal);
  const bufferPercent = Math.min(100, Math.round((bufferAmt / currentBal) * 100));

  // Determine safety indicator
  let safetyStatus = 'Safe';
  let safetyColor = 'bg-emerald-500 text-white';
  let safetyBorder = 'border-emerald-200 bg-emerald-50';
  let safetyDescription = 'Your baseline projected buffer comfortably protects your minimum reserve across 90 days.';

  if (metrics && !metrics.is_currently_safe) {
    safetyStatus = 'Critical Breach';
    safetyColor = 'bg-rose-600 text-white';
    safetyBorder = 'border-rose-200 bg-rose-50';
    safetyDescription = 'Baseline expenses exceed balance before next income. Minimum reserve breached.';
  } else if (metrics && metrics.min_buffer_90d < 500) {
    safetyStatus = 'Safe with Caution';
    safetyColor = 'bg-amber-500 text-white';
    safetyBorder = 'border-amber-200 bg-amber-50';
    safetyDescription = 'Reserves remain safe, but cash buffer drops near minimum threshold during peak bill dates.';
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-1">
            Personal Affordability Hub
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {selectedUser.name}</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Simulating liquidity over a strict 90-day horizon to ensure your purchase decisions never breach your safety reserves.
          </p>
        </div>
        <button
          onClick={onNavigateToAsk}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          Test a New Purchase
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Available Balance</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {curr} {currentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-600 font-mono">{bufferPercent}%</span> uncommitted discretionary buffer
          </div>
        </div>

        {/* Required Reserve */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Minimum Reserve</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {curr} {minBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Guaranteed baseline threshold
          </div>
        </div>

        {/* Upcoming 30d Income */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Confirmed 30d Income</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                +{curr} {metrics ? metrics.upcoming_income_30d.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '...'}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Verified payroll and bonus streams
          </div>
        </div>

        {/* Upcoming 30d Commitments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Essential Commitments</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                -{curr} {metrics ? metrics.upcoming_essential_30d.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '...'}
              </h3>
            </div>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Rent, utilities, medical obligations
          </div>
        </div>
      </div>

      {/* Safety Indicator & User Preferences Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Safety Indicator Card */}
        <div className={`p-6 rounded-2xl border ${safetyBorder} shadow-sm lg:col-span-2 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Financial Safety Status
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${safetyColor}`}>
                {safetyStatus}
              </span>
            </div>
            <h4 className="text-lg font-bold text-slate-900 mt-2">
              90-Day Liquidity Buffer: {curr} {metrics ? metrics.min_buffer_90d.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
            </h4>
            <p className="text-sm text-slate-600 mt-1">{safetyDescription}</p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Lowest 90d Point:</span>
              <p className="font-semibold text-slate-900 font-mono mt-0.5">
                {curr} {metrics ? metrics.lowest_projected_balance.toLocaleString() : '...'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Flexible Spending:</span>
              <p className="font-semibold text-slate-900 capitalize mt-0.5">
                {selectedUser.willingness_to_reduce_flexible_spending ? 'Adjustable' : 'Fixed Only'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Accepted Methods:</span>
              <p className="font-semibold text-slate-900 capitalize mt-0.5 truncate">
                {selectedUser.accepted_payment_methods.join(', ').replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* User Priorities Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profile Preferences</span>
            <h4 className="text-base font-bold text-slate-900 mt-1">Configured Risk Rules</h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Home Currency: <strong>{selectedUser.home_currency}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Priority: <strong>{selectedUser.financial_priorities.replace(/_/g, ' ')}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Min Reserve Ratio: <strong>{Math.round((minBal / currentBal) * 100)}% of balance</strong></span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Rules strictly enforced by deterministic calculation engine.
          </div>
        </div>
      </div>

      {/* Recent Decisions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Affordability Decisions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated evaluations based on strict 90-day cash flow simulation</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            {requests.length} Requests
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No requests registered for this user yet. Click "Test a New Purchase" above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Purchase Request</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Safe Today</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Recommended Method</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => {
                  let badge = {
                    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                    label: 'Affordable Now'
                  };
                  if (req.affordability_status === 'affordable_with_plan') {
                    badge = {
                      bg: 'bg-amber-50 text-amber-700 border-amber-200',
                      icon: <AlertTriangle className="w-3.5 h-3.5" />,
                      label: 'Affordable with Plan'
                    };
                  } else if (req.affordability_status === 'affordable_later') {
                    badge = {
                      bg: 'bg-orange-50 text-orange-700 border-orange-200',
                      icon: <Clock className="w-3.5 h-3.5" />,
                      label: 'Affordable Later'
                    };
                  } else if (req.affordability_status === 'not_affordable') {
                    badge = {
                      bg: 'bg-rose-50 text-rose-700 border-rose-200',
                      icon: <XCircle className="w-3.5 h-3.5" />,
                      label: 'Not Recommended'
                    };
                  }

                  return (
                    <tr key={req.request_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{req.purchase_description}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{req.request_id}</div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {curr} {req.requested_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700 text-xs">
                        {curr} {req.amount_safe_to_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${badge.bg}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 capitalize text-xs text-slate-700 font-medium">
                        {req.recommended_payment_method.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {req.desired_completion_date}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onSelectRequest(req.request_id)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          View Analysis
                          <ChevronRight className="w-3.5 h-3.5" />
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

      {/* Mandatory Disclaimer */}
      <Disclaimer />
    </div>
  );
};
