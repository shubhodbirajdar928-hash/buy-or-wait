import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, FileText, AlertTriangle, Calendar } from 'lucide-react';
import { UserProfile, TimelineItem } from '../types';
import { fetchTimeline } from '../services/api';
import { Disclaimer } from '../components/Disclaimer';

interface FinancialTimelineProps { selectedUser: UserProfile | null; }

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const filters = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'ignored', label: 'Ignored' },
  { id: 'essential', label: 'Essential' },
  { id: 'flexible', label: 'Flexible' },
];

export const FinancialTimeline: React.FC<FinancialTimelineProps> = ({ selectedUser }) => {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (selectedUser) {
      setLoading(true);
      fetchTimeline(selectedUser.user_id).then(d => setItems(d)).finally(() => setLoading(false));
    }
  }, [selectedUser]);

  if (!selectedUser) return <div className="flex items-center justify-center min-h-64 text-slate-500">Select a profile to view timeline.</div>;

  const curr = selectedUser.home_currency;

  const filtered = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'confirmed') return item.status.toLowerCase().includes('confirmed');
    if (filter === 'ignored') return item.status.toLowerCase().includes('ignored');
    if (filter === 'essential') return item.is_essential;
    if (filter === 'flexible') return item.is_flexible;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>Audited Cashflow Ledger</span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-2">Financial Timeline</h1>
          <p className="text-xs text-slate-500 mt-1">Complete chronological audit for <span className="text-slate-300 font-semibold">{selectedUser.name}</span></p>
        </div>
        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={filter === f.id
                ? { background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', fontWeight: 700 }
                : { color: '#64748b' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Events', value: items.length },
          { label: 'Confirmed', value: items.filter(i => i.status.toLowerCase().includes('confirmed')).length, color: '#10b981' },
          { label: 'Ignored', value: items.filter(i => i.status.toLowerCase().includes('ignored')).length, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-extrabold font-mono" style={{ color: s.color || '#e2e8f0' }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline stream */}
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-slate-500">No events match the selected filter.</div>
      ) : (
        <div className="relative pl-8 space-y-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', marginLeft: '16px' }}>
          {filtered.map((item, idx) => {
            const isIgnored = item.status.toLowerCase().includes('ignored');
            const isIncome = item.category.toLowerCase().includes('income') || item.category.toLowerCase().includes('balance');
            const isOCR = item.description.toLowerCase().includes('ocr');
            const dotColor = isIgnored ? '#ef4444' : item.is_essential ? '#f59e0b' : '#10b981';

            return (
              <div key={idx} className="relative group">
                {/* Timeline dot */}
                <div className="absolute -left-[41px] top-5 w-4 h-4 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                  style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}60`, border: `2px solid ${dotColor}40` }} />

                <div className="rounded-2xl p-5 transition-all hover:scale-[1.005]"
                  style={{ background: isIgnored ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isIgnored ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)'}` }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>{item.date}</span>
                      <span className="text-[11px] text-slate-600 font-mono">{item.id}</span>
                      {isOCR && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                          <FileText className="w-3 h-3" />OCR
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={isIgnored
                          ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                          : { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                        {item.status}
                      </span>
                      {item.is_essential && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>Essential</span>}
                      {item.is_flexible && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.1)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.2)' }}>Flexible</span>}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="font-bold text-slate-100">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-base font-bold font-mono flex items-center gap-1.5 ${isIgnored ? 'line-through text-slate-600' : isIncome ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {isIncome ? '+' : '-'}{item.currency} {fmt(item.amount)}
                      </div>
                      <div className="text-[10px] text-slate-600 capitalize mt-0.5">{item.category}</div>
                    </div>
                  </div>

                  {isIgnored && (
                    <div className="mt-3 flex items-center gap-2 text-[11px] p-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span className="text-slate-500">Safety Rule: Unconfirmed/pending credits are strictly excluded from spendable balance calculations.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Disclaimer />
    </div>
  );
};
