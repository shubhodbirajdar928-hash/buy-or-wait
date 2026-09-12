import React, { useEffect, useState } from 'react';
import { 
  Clock, ArrowDownRight, ArrowUpRight, ShieldCheck, 
  FileText, AlertTriangle, CheckCircle2, Filter, Eye 
} from 'lucide-react';
import { UserProfile, TimelineItem } from '../types';
import { fetchTimeline } from '../services/api';
import { Disclaimer } from '../components/Disclaimer';

interface FinancialTimelineProps {
  selectedUser: UserProfile | null;
}

export const FinancialTimeline: React.FC<FinancialTimelineProps> = ({ selectedUser }) => {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    if (selectedUser) {
      setLoading(true);
      fetchTimeline(selectedUser.user_id)
        .then(data => setItems(data))
        .finally(() => setLoading(false));
    }
  }, [selectedUser]);

  if (!selectedUser) {
    return <div className="p-8 text-center text-slate-500">Please select a user to view timeline.</div>;
  }

  const curr = selectedUser.home_currency;

  const filteredItems = items.filter(item => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'confirmed') return item.status.toLowerCase().includes('confirmed');
    if (selectedFilter === 'ignored') return item.status.toLowerCase().includes('ignored');
    if (selectedFilter === 'essential') return item.is_essential;
    if (selectedFilter === 'flexible') return item.is_flexible;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Audited Cashflow Ledger
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Financial Timeline for {selectedUser.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete chronological audit of inflows, recurring outlays, OCR-extracted invoices, and ignored transactions.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'ignored', label: 'Ignored' },
            { id: 'essential', label: 'Essential' },
            { id: 'flexible', label: 'Flexible' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedFilter === f.id
                  ? 'bg-white text-slate-900 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-slate-200 ml-4 sm:ml-6 my-6">
        {filteredItems.map((item, idx) => {
          const isIgnored = item.status.toLowerCase().includes('ignored');
          const isIncome = item.category.toLowerCase().includes('income') || item.category.toLowerCase().includes('balance');
          const isOCR = item.description.toLowerCase().includes('ocr');

          let dotColor = 'bg-emerald-500 ring-4 ring-emerald-100';
          if (isIgnored) dotColor = 'bg-rose-500 ring-4 ring-rose-100';
          else if (item.is_essential) dotColor = 'bg-amber-500 ring-4 ring-amber-100';

          return (
            <div key={idx} className="relative group">
              {/* Timeline dot */}
              <div className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full ${dotColor} transition-transform group-hover:scale-125`} />

              {/* Event Card */}
              <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
                isIgnored ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.date}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      {item.id}
                    </span>
                    {isOCR && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        OCR Extracted
                      </span>
                    )}
                  </div>

                  {/* Labels / Badges */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                      isIgnored
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {item.status}
                    </span>

                    {item.is_essential && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Essential
                      </span>
                    )}

                    {item.is_flexible && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        Flexible
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className={`text-base font-bold font-mono ${
                      isIgnored ? 'text-slate-400 line-through' : isIncome ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {isIncome ? '+' : '-'}{item.currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">{item.category}</div>
                  </div>
                </div>

                {isIgnored && (
                  <div className="mt-3 text-[11px] text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      Safety Engine Rule: Unconfirmed or pending credits/cancelled events are strictly omitted from spendable balance calculations.
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory Disclaimer */}
      <Disclaimer />
    </div>
  );
};
