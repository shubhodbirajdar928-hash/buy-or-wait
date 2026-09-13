import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, FileText, AlertTriangle, Calendar, Clock, CheckCircle2, Shield } from 'lucide-react';
import { UserProfile, TimelineItem } from '../types';
import { fetchTimeline } from '../services/api';
import { Disclaimer } from '../components/Disclaimer';

interface FinancialTimelineProps { selectedUser: UserProfile | null; }

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Convert "2026-09-12" to "Sep 12, 2026"
const formatHumanDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
  const day = parseInt(parts[2], 10);
  return { month, day, year, full: `${month} ${day}, ${year}` };
};

const filters = [
  { id: 'all', label: 'All Items' },
  { id: 'confirmed', label: 'Confirmed Cash Flow' },
  { id: 'ignored', label: 'Ignored / Risky' },
  { id: 'essential', label: 'Essential Bills' },
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
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 1. Clear Header with "Today" Reference Date */}
      <div className="glass rounded-2xl p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Verified Cash Flow Calendar
              </span>
              {/* CURRENT ACCURATE SIMULATION DATE */}
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1.5 font-mono">
                <Clock className="w-3 h-3 text-blue-400" /> Today: Sep 12, 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Financial Timeline</h1>
            <p className="text-xs text-slate-400 mt-1">
              Your chronological schedule of paychecks and bills for <span className="text-white font-semibold">{selectedUser.name}</span>.
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
            {filters.map(f => (
              <button 
                key={f.id} 
                onClick={() => setFilter(f.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filter === f.id 
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Roomy, Uncluttered Timeline Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="shimmer h-24 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-slate-400">
          No records found in this category.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item, idx) => {
            const isIgnored = item.status.toLowerCase().includes('ignored');
            const isIncome = item.category.toLowerCase().includes('income') || item.category.toLowerCase().includes('balance');
            const isOCR = item.description.toLowerCase().includes('ocr');
            const isToday = item.date === '2026-09-12';
            const dateObj = formatHumanDate(item.date);

            return (
              <div 
                key={idx}
                className="glass rounded-2xl p-5 sm:p-6 transition-all hover:bg-white/[0.04] border border-white/10"
                style={{
                  background: isIgnored 
                    ? 'rgba(239, 68, 68, 0.03)' 
                    : isToday 
                    ? 'rgba(16, 185, 129, 0.05)' 
                    : 'rgba(255, 255, 255, 0.02)',
                  borderColor: isIgnored 
                    ? 'rgba(239, 68, 68, 0.15)' 
                    : isToday 
                    ? 'rgba(16, 185, 129, 0.25)' 
                    : 'rgba(255, 255, 255, 0.07)'
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Date Badge & Title */}
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Clear Calendar Date Box */}
                    <div 
                      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border"
                      style={{
                        background: isToday ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        borderColor: isToday ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                        {typeof dateObj === 'object' ? dateObj.month : 'Date'}
                      </span>
                      <span className="text-lg font-extrabold text-white font-mono leading-tight">
                        {typeof dateObj === 'object' ? dateObj.day : item.date}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-base font-bold ${isIgnored ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {item.title}
                        </h3>

                        {/* "Today" Marker */}
                        {isToday && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ★ TODAY
                          </span>
                        )}

                        {/* OCR Badge */}
                        {isOCR && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Scanned from Receipt
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Status */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    <div className={`text-lg font-bold font-mono flex items-center gap-1 ${
                      isIgnored 
                        ? 'text-slate-500 line-through' 
                        : isIncome 
                        ? 'text-emerald-400' 
                        : 'text-slate-200'
                    }`}>
                      {isIncome ? '+' : '-'}{item.currency} {fmt(item.amount)}
                    </div>

                    {/* Status Pill */}
                    <div className="mt-1">
                      {isIgnored ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Unconfirmed (Ignored)
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 capitalize bg-white/5 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Safety note on ignored items */}
                {isIgnored && (
                  <div className="mt-3 text-[11px] text-rose-300/80 bg-rose-500/5 border border-rose-500/15 rounded-xl p-2.5 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>
                      <strong>Safety Rule:</strong> This money hasn't arrived in your bank yet, so the AI strictly protects you by not counting it.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Disclaimer />
    </div>
  );
};
