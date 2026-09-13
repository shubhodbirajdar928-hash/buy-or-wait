import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { UserProfile, EvaluationResponse } from '../types';
import { submitCustomEvaluation } from '../services/api';
import { Disclaimer } from '../components/Disclaimer';

interface AskBuyOrWaitProps {
  selectedUser: UserProfile | null;
  onEvaluationComplete: (result: EvaluationResponse) => void;
}

const currSymbol = (c: string) => ({ INR: '₹', USD: '$', EUR: '€', GBP: '£' }[c] || c);

const examplePrompts = [
  { text: 'Can I afford a new laptop?', desc: 'Workstation Laptop M3', amt: 1200, type: 'equipment' },
  { text: '₹30,000 tuition payment?', desc: 'Executive Certification Tuition', amt: 30000, curr: 'INR', type: 'education' },
  { text: 'Send money to family?', desc: 'Family Renovation Assistance', amt: 600, type: 'family_support' },
  { text: 'Book a vacation trip?', desc: 'Autumn Holiday Booking', amt: 1500, type: 'travel' },
  { text: 'Invest a lump sum?', desc: 'Index Fund Investment', amt: 2000, type: 'investment' },
];

export const AskBuyOrWait: React.FC<AskBuyOrWaitProps> = ({ selectedUser, onEvaluationComplete }) => {
  const [naturalQuery, setNaturalQuery] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState(selectedUser?.home_currency || 'INR');
  const [completionDate, setCompletionDate] = useState('2026-10-31');
  const [requestType, setRequestType] = useState('one_time_purchase');
  const [allowsPartial, setAllowsPartial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => { if (selectedUser) setCurrency(selectedUser.home_currency); }, [selectedUser]);

  const handleChipClick = (p: typeof examplePrompts[0]) => {
    setNaturalQuery(p.text); setDescription(p.desc); setAmount(p.amt);
    setCurrency(p.curr || selectedUser?.home_currency || 'INR');
    setRequestType(p.type);
  };

  const handleNaturalQueryChange = (text: string) => {
    setNaturalQuery(text);
    const lower = text.toLowerCase();
    if (lower.includes('laptop') || lower.includes('macbook')) { setDescription('Workstation Laptop'); setRequestType('equipment'); if (amount === '') setAmount(1200); }
    else if (lower.includes('tuition') || lower.includes('course')) { setDescription('Tuition Fee Payment'); setRequestType('education'); if (amount === '') setAmount(30000); }
    else if (lower.includes('family') || lower.includes('send money')) { setDescription('Family Support Fund'); setRequestType('family_support'); if (amount === '') setAmount(500); }
    else if (lower.includes('vacation') || lower.includes('travel')) { setDescription('Holiday Vacation Booking'); setRequestType('travel'); if (amount === '') setAmount(1500); }
    else if (lower.includes('invest')) { setDescription('Investment Deposit'); setRequestType('investment'); if (amount === '') setAmount(2000); }
    const matchAmt = text.match(/[$€£₹]?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?)/);
    if (matchAmt && matchAmt[1] && amount === '') {
      const num = parseFloat(matchAmt[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) setAmount(num);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || amount === '' || amount <= 0) return;
    setSubmitting(true);
    try {
      const result = await submitCustomEvaluation({
        user_id: selectedUser.user_id,
        purchase_description: description || naturalQuery || 'Requested Purchase',
        requested_amount: Number(amount),
        currency, desired_completion_date: completionDate,
        request_type: requestType, allows_partial_payment: allowsPartial,
        request_date: '2026-09-12'
      });
      onEvaluationComplete(result);
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Sparkles className="w-3.5 h-3.5" /> Affordability Inquiry Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Should I <span className="gradient-text-green">Buy</span> or <span style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Wait</span>?
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Describe any purchase. Our AI runs a deterministic 90-day cash flow simulation to give you a safe, fact-grounded answer.
        </p>
      </div>

      {/* Quick prompts */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quick Examples</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((p, idx) => (
            <button key={idx} type="button" onClick={() => handleChipClick(p)}
              className="text-xs font-medium px-3 py-2 rounded-lg transition-all flex items-center gap-1.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#10b981'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.25)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}>
              <Sparkles className="w-3 h-3 text-emerald-500/70 flex-shrink-0" /> {p.text}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 sm:p-8 space-y-5">
        {/* Natural language */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Natural Language Query</label>
          <div className="relative">
            <input type="text" value={naturalQuery} onChange={e => handleNaturalQueryChange(e.target.value)}
              placeholder='e.g. "Can I afford ₹50,000 for a course before December?"'
              className="input-field pr-10" />
            <Sparkles className="w-4 h-4 text-emerald-500/50 absolute right-3.5 top-3.5" />
          </div>
          <p className="text-[11px] text-slate-600">Type naturally, or fill in the fields below directly.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Description */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Purchase Description *</label>
            <input type="text" required value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Workstation Laptop M3" className="input-field" />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Amount *</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">{currSymbol(currency)}</span>
              <input type="number" step="0.01" min="1" required value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00" className="input-field pl-8 font-mono font-semibold" />
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Currency *</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="input-field">
              <option value="INR">🇮🇳 INR — Indian Rupee (₹)</option>
              <option value="USD">🇺🇸 USD — US Dollar ($)</option>
              <option value="EUR">🇪🇺 EUR — Euro (€)</option>
              <option value="GBP">🇬🇧 GBP — British Pound (£)</option>
            </select>
          </div>

          {/* Completion Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Desired Completion Date *</label>
            <input type="date" required value={completionDate} onChange={e => setCompletionDate(e.target.value)} className="input-field" />
            <p className="text-[10px] text-slate-600">Must be within 90 days of 2026-09-12.</p>
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Request Category</label>
            <select value={requestType} onChange={e => setRequestType(e.target.value)} className="input-field">
              <option value="one_time_purchase">One-Time Discretionary Purchase</option>
              <option value="equipment">Work & Productivity Equipment</option>
              <option value="education">Education & Upskilling</option>
              <option value="family_support">Family Support & Transfers</option>
              <option value="travel">Travel & Vacation</option>
              <option value="auto_repair">Auto & Essential Repair</option>
              <option value="investment">Long-Term Investment</option>
            </select>
          </div>
        </div>

        {/* Partial payment toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div className="text-sm font-semibold text-slate-200">Allow Partial Payment Split</div>
            <div className="text-xs text-slate-500 mt-0.5">Pay safe buffer today; complete the rest when income arrives.</div>
          </div>
          <button type="button" onClick={() => setAllowsPartial(!allowsPartial)}
            className="w-12 h-6 rounded-full flex items-center transition-all flex-shrink-0 ml-4"
            style={{ background: allowsPartial ? '#10b981' : 'rgba(255,255,255,0.12)', justifyContent: allowsPartial ? 'flex-end' : 'flex-start', padding: '3px' }}>
            <div className="w-4.5 h-4.5 bg-white rounded-full shadow-md transition-all" style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Profile context */}
        {selectedUser && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl text-xs" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-400">
              Evaluating for <span className="text-slate-200 font-semibold">{selectedUser.name}</span> — Balance: <span className="text-emerald-400 font-mono font-semibold">{selectedUser.home_currency} {selectedUser.current_balance.toLocaleString()}</span>, Reserve: <span className="text-slate-300 font-mono">{selectedUser.home_currency} {selectedUser.minimum_balance_to_keep.toLocaleString()}</span>
            </span>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={submitting || amount === '' || amount <= 0} className="btn-primary w-full py-4 text-base">
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Computing 90-Day Cash Flow...</>
          ) : (
            <>Run Affordability Analysis <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <Disclaimer />
    </div>
  );
};
