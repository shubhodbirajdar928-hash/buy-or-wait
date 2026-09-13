import React from 'react';
import { CheckCircle2, XCircle, Trophy, ShieldCheck, ArrowLeft, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { EvaluationResponse } from '../types';
import { Disclaimer } from '../components/Disclaimer';

interface ScenarioComparisonProps {
  data: EvaluationResponse | null;
  onNavigateToRecommendation: () => void;
  onNavigateToAsk: () => void;
}

const fmt = (n: number, d = 2) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const rankingRules = [
  { n: 1, title: 'Deadline Adherence', desc: 'Entire request must complete on or before desired_completion_date.' },
  { n: 2, title: 'Spending Change Avoidance', desc: 'Plans requiring no flexible spending cuts strictly outrank plans requiring cuts.' },
  { n: 3, title: 'Total Outlay Minimization', desc: 'Lower total cost (including fees) ranks higher.' },
  { n: 4, title: 'Earlier Start', desc: 'Plans that safely initiate on an earlier calendar date are prioritized.' },
  { n: 5, title: 'Fewer Payments', desc: 'Plans with fewer installments rank ahead of multi-installment obligations.' },
  { n: 6, title: 'Deterministic Tie-Breaker', desc: 'Lowest payment_option_id breaks any remaining ties.' },
];

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ data, onNavigateToRecommendation, onNavigateToAsk }) => {
  if (!data) return (
    <div className="glass rounded-2xl p-16 text-center space-y-5">
      <HelpCircle className="w-14 h-14 mx-auto" style={{ color: '#334155' }} />
      <div>
        <h3 className="text-lg font-bold text-slate-200">No Request Evaluated Yet</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">Evaluate an affordability request first to see the full multi-scenario comparison matrix.</p>
      </div>
      <button onClick={onNavigateToAsk} className="btn-primary mx-auto">Evaluate a Purchase <ArrowRight className="w-4 h-4" /></button>
    </div>
  );

  const { evaluation, scenarios } = data;
  const curr = evaluation.home_currency;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>Exhaustive Path Analysis</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Scenario Comparison Matrix</h1>
          <p className="text-xs text-slate-500 mt-1">All 5 payment methods evaluated against deadline <span className="text-slate-300 font-semibold">{evaluation.desired_completion_date}</span> and minimum reserve rules.</p>
        </div>
        <button onClick={onNavigateToRecommendation} className="btn-ghost flex-shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Decision
        </button>
      </div>

      {/* Scenario Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full dark-table text-left" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Total Paid</th>
                <th>First Payment</th>
                <th>Final Payment</th>
                <th>Lowest Balance</th>
                <th>Reserve Safe?</th>
                <th>Deadline Met?</th>
                <th>User Accepts?</th>
                <th className="text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((sc, idx) => {
                const isWinner = sc.method === evaluation.recommended_payment_method && sc.payment_plan === evaluation.payment_plan;
                return (
                  <tr key={idx} style={{ background: isWinner ? 'rgba(16,185,129,0.06)' : undefined }}>
                    <td>
                      <div className="flex items-center gap-2">
                        {isWinner && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' }}>
                            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-200 text-sm">{sc.scenario_name}</div>
                          <div className="text-[11px] text-slate-600 font-mono capitalize">{sc.method.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono font-semibold text-slate-200">{sc.total_amount_paid > 0 ? `${curr} ${fmt(sc.total_amount_paid)}` : '—'}</td>
                    <td className="font-mono text-slate-400 text-xs">{sc.first_payment_date || '—'}</td>
                    <td className="font-mono text-slate-400 text-xs">{sc.final_payment_date || '—'}</td>
                    <td className="font-mono font-semibold text-slate-300">{curr} {fmt(sc.lowest_projected_balance)}</td>
                    <td>
                      {sc.is_safe
                        ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle2 className="w-3 h-3" />Safe</span>
                        : <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><XCircle className="w-3 h-3" />Violated</span>}
                    </td>
                    <td>
                      {sc.completed_by_deadline
                        ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400"><CheckCircle2 className="w-3 h-3" />Yes</span>
                        : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400"><XCircle className="w-3 h-3" />Overdue</span>}
                    </td>
                    <td>
                      {sc.is_accepted_by_user
                        ? <span className="text-[11px] text-slate-400">Accepted</span>
                        : <span className="text-[11px] text-slate-600 italic">Declined</span>}
                    </td>
                    <td className="text-center">
                      {isWinner
                        ? <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff' }}><Trophy className="w-3 h-3" />Recommended</span>
                        : sc.rejection_reason
                        ? <span className="text-[11px] px-2 py-0.5 rounded-md max-w-[130px] inline-block truncate" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }} title={sc.rejection_reason}>{sc.rejection_reason}</span>
                        : <span className="text-[11px] text-slate-600" style={{ background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '6px' }}>Alternative</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ranking Rules */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h4 className="font-bold text-slate-100">Plan-Ranking Priority Rules</h4>
          <span className="text-[11px] font-semibold text-emerald-400 ml-1">Deterministically applied</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rankingRules.map(r => (
            <div key={r.n} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>{r.n}</span>
                <span className="text-sm font-semibold text-slate-200">{r.title}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <Disclaimer />
    </div>
  );
};
