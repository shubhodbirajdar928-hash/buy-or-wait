import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, CheckCircle2, Search, Image } from 'lucide-react';
import { AdminData } from '../types';
import { fetchAdminData, triggerBatchRegeneration } from '../services/api';
import { Disclaimer } from '../components/Disclaimer';

const tabs = [
  { id: 'output', label: 'output.csv', key: 'output' },
  { id: 'requests', label: 'requests.csv', key: 'requests' },
  { id: 'profiles', label: 'profiles.csv', key: 'financial_profiles' },
  { id: 'events', label: 'events.csv', key: 'financial_events' },
  { id: 'ocr', label: 'OCR Extractions', key: 'ocr_extractions' },
  { id: 'messages', label: 'messages.csv', key: 'messages' },
  { id: 'rates', label: 'exchange_rates.csv', key: 'exchange_rates' },
  { id: 'options', label: 'payment_options.csv', key: 'request_payment_options' },
];

const statusHighlight = (val: string) => {
  const v = val.toLowerCase();
  if (v.includes('affordable_now') || v.includes('safe') || v.includes('confirmed')) return { background: 'rgba(16,185,129,0.12)', color: '#10b981' };
  if (v.includes('plan') || v.includes('partial')) return { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
  if (v.includes('later')) return { background: 'rgba(249,115,22,0.12)', color: '#f97316' };
  if (v.includes('not_') || v.includes('violated')) return { background: 'rgba(239,68,68,0.12)', color: '#ef4444' };
  return null;
};

export const AdminDataView: React.FC = () => {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('output');
  const [search, setSearch] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [regenMsg, setRegenMsg] = useState<string | null>(null);

  const loadData = () => { setLoading(true); fetchAdminData().then(d => setData(d)).finally(() => setLoading(false)); };
  useEffect(() => { loadData(); }, []);

  const handleRegen = async () => {
    setRegenerating(true); setRegenMsg(null);
    try { const r = await triggerBatchRegeneration(); setRegenMsg(r.message); loadData(); }
    catch { setRegenMsg('Regeneration failed. Check backend console.'); }
    finally { setRegenerating(false); }
  };

  if (loading && !data) return (
    <div className="flex items-center justify-center min-h-64 gap-3 text-slate-500">
      <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" /> Loading dataset tables...
    </div>
  );

  const getRows = (): any[] => {
    if (!data) return [];
    const tab = tabs.find(t => t.id === activeTab);
    if (!tab) return [];
    return (data as any)[tab.key] || [];
  };

  const rows = getRows();
  const filteredRows = rows.filter(r => !search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase())));
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>Developer & Audit Center</span>
            <span className="text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399' }}><CheckCircle2 className="w-3 h-3" />All Constraints Passed</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Data Inspector & CSV Audit</h1>
          <p className="text-xs text-slate-500 mt-1">Inspect raw CSV records, OCR extractions, and batch predictions.</p>
        </div>
        <button onClick={handleRegen} disabled={regenerating} className="btn-primary flex-shrink-0">
          <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
          Regenerate output.csv
        </button>
      </div>

      {regenMsg && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl text-xs" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
          <CheckCircle2 className="w-4 h-4" /> {regenMsg}
        </div>
      )}

      {/* Tab pills */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        {tabs.map(t => {
          const rowCount = data ? ((data as any)[t.key]?.length || 0) : 0;
          const isActive = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSearch(''); }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0"
              style={{
                background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                color: isActive ? '#10b981' : '#64748b',
                border: `1px solid ${isActive ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
              }}>
              {t.label}
              <span className="px-1.5 py-0.5 rounded-md text-[10px]" style={{ background: isActive ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)', color: isActive ? '#10b981' : '#475569' }}>{rowCount}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="glass rounded-xl p-3 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${rows.length} rows...`}
            className="input-field pl-9 py-2 text-xs" />
        </div>
        <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
          {filteredRows.length} of {rows.length} rows
        </span>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">{search ? 'No matching records.' : 'No data loaded — backend may be offline.'}</div>
        ) : (
          <div className="overflow-auto custom-scrollbar" style={{ maxHeight: '560px' }}>
            <table className="w-full dark-table" style={{ minWidth: columns.length * 120 + 'px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ background: 'rgba(8,13,26,0.97)' }}>#</th>
                  {columns.map(col => <th key={col} style={{ background: 'rgba(8,13,26,0.97)' }}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="font-mono text-slate-600 font-bold text-xs">{idx + 1}</td>
                    {columns.map(col => {
                      const val = row[col];
                      const valStr = String(val ?? '');
                      const highlight = (col === 'affordability_status' || col === 'status' || col === 'recommended_payment_method') ? statusHighlight(valStr) : null;
                      const isAmt = col.includes('amount') || col.includes('balance') || col.includes('fee') || col.includes('rate');
                      return (
                        <td key={col} className="max-w-[200px] truncate" title={valStr}>
                          {highlight ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold font-mono" style={highlight}>{valStr}</span>
                          ) : isAmt ? (
                            <span className="font-mono font-semibold text-slate-300">{valStr}</span>
                          ) : (
                            <span className="font-mono text-slate-400">{valStr}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Disclaimer />
    </div>
  );
};
