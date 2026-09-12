import React from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, ArrowRight, 
  HelpCircle, Trophy, ShieldCheck, DollarSign, Calendar 
} from 'lucide-react';
import { EvaluationResponse } from '../types';
import { Disclaimer } from '../components/Disclaimer';

interface ScenarioComparisonProps {
  data: EvaluationResponse | null;
  onNavigateToRecommendation: () => void;
  onNavigateToAsk: () => void;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  data,
  onNavigateToRecommendation,
  onNavigateToAsk
}) => {
  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
        <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Request Evaluated Yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Evaluate an affordability request first to view the exhaustive multi-scenario comparison matrix.
        </p>
        <button
          onClick={onNavigateToAsk}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
        >
          Evaluate a Purchase
        </button>
      </div>
    );
  }

  const { evaluation, scenarios } = data;
  const curr = evaluation.home_currency;

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Exhaustive Path Analysis
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Scenario Comparison Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluating all 5 candidate methods against deadline <span className="font-semibold text-slate-800">{evaluation.desired_completion_date}</span> and minimum reserve rules.
          </p>
        </div>

        <button
          onClick={onNavigateToRecommendation}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
        >
          <span>Back to Recommendation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3.5">Scenario / Method</th>
                <th className="px-4 py-3.5">Total Paid</th>
                <th className="px-4 py-3.5">First Payment</th>
                <th className="px-4 py-3.5">Final Payment</th>
                <th className="px-4 py-3.5">Lowest Balance</th>
                <th className="px-4 py-3.5">Min Reserve Kept?</th>
                <th className="px-4 py-3.5">Deadline Met?</th>
                <th className="px-4 py-3.5">User Accepted?</th>
                <th className="px-4 py-3.5 text-center">Status & Ranking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarios.map((sc, index) => {
                const isWinner = sc.method === evaluation.recommended_payment_method && sc.payment_plan === evaluation.payment_plan;
                const minReserveKept = sc.is_safe;
                const rowBg = isWinner ? 'bg-emerald-50/70 font-medium' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40';

                return (
                  <tr key={index} className={`${rowBg} hover:bg-slate-100/70 transition-colors`}>
                    {/* Scenario Name */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {isWinner && (
                          <span className="p-1 rounded-full bg-emerald-500 text-white flex-shrink-0" title="Selected Best Path">
                            <Trophy className="w-3 h-3" />
                          </span>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{sc.scenario_name}</div>
                          <div className="text-[10px] text-slate-400 capitalize font-mono">{sc.method.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                    </td>

                    {/* Total Amount Paid */}
                    <td className="px-4 py-4 font-mono font-bold text-slate-900">
                      {sc.total_amount_paid > 0 ? `${curr} ${sc.total_amount_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '0.00'}
                    </td>

                    {/* First Payment Date */}
                    <td className="px-4 py-4 font-mono text-slate-700">
                      {sc.first_payment_date || '—'}
                    </td>

                    {/* Final Payment Date */}
                    <td className="px-4 py-4 font-mono text-slate-700">
                      {sc.final_payment_date || '—'}
                    </td>

                    {/* Lowest Projected Balance */}
                    <td className="px-4 py-4 font-mono font-semibold text-slate-800">
                      {curr} {sc.lowest_projected_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Min Balance Violated? */}
                    <td className="px-4 py-4">
                      {minReserveKept ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Kept Safe
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3 h-3" /> Violated
                        </span>
                      )}
                    </td>

                    {/* Deadline Met? */}
                    <td className="px-4 py-4">
                      {sc.completed_by_deadline ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                          <XCircle className="w-3 h-3 text-rose-500" /> Overdue
                        </span>
                      )}
                    </td>

                    {/* Accepted by User? */}
                    <td className="px-4 py-4">
                      {sc.is_accepted_by_user ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-slate-500" /> Accepted
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Declined
                        </span>
                      )}
                    </td>

                    {/* Final Status */}
                    <td className="px-4 py-4 text-center">
                      {isWinner ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                          <Trophy className="w-3 h-3" /> Recommended
                        </span>
                      ) : sc.rejection_reason ? (
                        <span className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md inline-block max-w-[150px] truncate" title={sc.rejection_reason}>
                          {sc.rejection_reason}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Eligible Alternative
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan-Ranking Rules Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Plan-Ranking Priority Rules (Deterministically Applied)
        </h4>
        <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed">
          <li><strong>Deadline Adherence:</strong> The entire request must complete on or before <code>desired_completion_date</code>.</li>
          <li><strong>Spending Change Avoidance:</strong> Plans requiring no flexible spending cuts strictly outrank plans requiring cuts.</li>
          <li><strong>Total Outlay Minimization:</strong> Plans with lower total cost (including financing/interest fees) rank higher.</li>
          <li><strong>Earlier Start:</strong> Plans that can safely initiate on an earlier calendar date are prioritized.</li>
          <li><strong>Fewer Payments:</strong> Plans with fewer installments rank ahead of multi-installment obligations.</li>
          <li><strong>Deterministic Tie-Breaker:</strong> Lowest <code>payment_option_id</code> breaks any remaining mathematical ties.</li>
        </ol>
      </div>

      {/* Mandatory Disclaimer */}
      <Disclaimer />
    </div>
  );
};
