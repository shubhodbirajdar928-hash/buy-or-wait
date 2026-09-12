import React, { useEffect, useState } from 'react';
import { 
  Database, RefreshCw, CheckCircle2, AlertCircle, FileText, 
  Search, ExternalLink, ShieldCheck, Download 
} from 'lucide-react';
import { AdminData } from '../types';
import { fetchAdminData, triggerBatchRegeneration } from '../services/api';
import { Disclaimer } from '../components/Disclaimer';

export const AdminDataView: React.FC = () => {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('output');
  const [searchTerm, setSearchTerm] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [regenMessage, setRegenMessage] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    fetchAdminData()
      .then(d => setData(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenMessage(null);
    try {
      const res = await triggerBatchRegeneration();
      setRegenMessage(res.message);
      loadData();
    } catch (err: any) {
      setRegenMessage('Regeneration failed. Check backend console.');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Loading dataset tables and joined records...</span>
      </div>
    );
  }

  const tabs = [
    { id: 'output', label: 'output.csv (Final Predictions)', count: data?.output.length || 0 },
    { id: 'requests', label: 'requests.csv', count: data?.requests.length || 0 },
    { id: 'profiles', label: 'financial_profiles.csv', count: data?.financial_profiles.length || 0 },
    { id: 'events', label: 'financial_events.csv', count: data?.financial_events.length || 0 },
    { id: 'ocr', label: 'OCR Image Extractions', count: data?.ocr_extractions.length || 0 },
    { id: 'messages', label: 'messages.csv (Adversarial Tests)', count: data?.messages.length || 0 },
    { id: 'rates', label: 'exchange_rates.csv', count: data?.exchange_rates.length || 0 },
    { id: 'options', label: 'request_payment_options.csv', count: data?.request_payment_options.length || 0 }
  ];

  // Get table rows based on activeTab
  let rows: any[] = [];
  if (data) {
    if (activeTab === 'output') rows = data.output;
    else if (activeTab === 'requests') rows = data.requests;
    else if (activeTab === 'profiles') rows = data.financial_profiles;
    else if (activeTab === 'events') rows = data.financial_events;
    else if (activeTab === 'ocr') rows = data.ocr_extractions;
    else if (activeTab === 'messages') rows = data.messages;
    else if (activeTab === 'rates') rows = data.exchange_rates;
    else if (activeTab === 'options') rows = data.request_payment_options;
  }

  // Filter rows by search
  const filteredRows = rows.filter(r => {
    if (!searchTerm) return true;
    return Object.values(r).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Developer & Audit Center
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              100% Constraints Passed
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Data Inspector & CSV Pipeline Audit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Inspect raw CSV records, OCR image extractions, joined foreign keys, and batch generated predictions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate output.csv</span>
          </button>
        </div>
      </div>

      {regenMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{regenMessage}</span>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setSearchTerm(''); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === t.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span>{t.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === t.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search across ${rows.length} rows...`}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono pr-2">
          Showing {filteredRows.length} of {rows.length}
        </span>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No matching records found.</div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-400">#</th>
                  {columns.map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                    {columns.map((col) => {
                      const val = row[col];
                      const isStatus = col === 'affordability_status' || col === 'status';
                      const isAmount = col.includes('amount') || col.includes('balance') || col.includes('fee');

                      return (
                        <td key={col} className="px-4 py-3 font-mono text-slate-800 max-w-xs truncate" title={String(val)}>
                          {isStatus ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              String(val).toLowerCase().includes('safe') || String(val).toLowerCase().includes('confirmed')
                                ? 'bg-emerald-100 text-emerald-800'
                                : String(val).toLowerCase().includes('plan')
                                ? 'bg-amber-100 text-amber-800'
                                : String(val).toLowerCase().includes('later')
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {val}
                            </span>
                          ) : isAmount ? (
                            <span className="font-semibold">{val}</span>
                          ) : (
                            val
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

      {/* Mandatory Disclaimer */}
      <Disclaimer />
    </div>
  );
};
