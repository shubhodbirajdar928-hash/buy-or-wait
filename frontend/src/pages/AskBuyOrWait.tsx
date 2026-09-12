import React, { useState } from 'react';
import { Sparkles, Calendar, DollarSign, Tag, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { UserProfile, EvaluationResponse } from '../types';
import { submitCustomEvaluation } from '../services/api';
import { Disclaimer } from '../components/Disclaimer';

interface AskBuyOrWaitProps {
  selectedUser: UserProfile | null;
  onEvaluationComplete: (result: EvaluationResponse) => void;
}

export const AskBuyOrWait: React.FC<AskBuyOrWaitProps> = ({
  selectedUser,
  onEvaluationComplete,
}) => {
  const [naturalQuery, setNaturalQuery] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState(selectedUser?.home_currency || 'INR');
  const [completionDate, setCompletionDate] = useState('2026-10-31');
  const [requestType, setRequestType] = useState('one_time_purchase');
  const [allowsPartial, setAllowsPartial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (selectedUser) {
      setCurrency(selectedUser.home_currency);
    }
  }, [selectedUser]);

  // Example prompt chips
  const examplePrompts = [
    { text: 'Can I afford this laptop?', desc: 'MacBook Pro M3 Workstation', amt: 1200, type: 'equipment' },
    { text: 'Can I pay ₹30,000 for my tuition?', desc: 'Executive Certification Tuition', amt: 30000, curr: 'INR', type: 'education' },
    { text: 'Can I send money to my family?', desc: 'Family Renovation Assistance', amt: 600, type: 'family_support' },
    { text: 'Should I book this vacation?', desc: 'Autumn Holiday Travel Booking', amt: 1500, type: 'travel' },
    { text: 'Can I invest this amount?', desc: 'Index Fund Investment Contribution', amt: 2000, type: 'investment' },
  ];

  const handleChipClick = (prompt: typeof examplePrompts[0]) => {
    setNaturalQuery(prompt.text);
    setDescription(prompt.desc);
    setAmount(prompt.amt);
    if (prompt.curr) setCurrency(prompt.curr);
    else if (selectedUser) setCurrency(selectedUser.home_currency);
    setRequestType(prompt.type);
  };

  const handleNaturalQueryChange = (text: string) => {
    setNaturalQuery(text);
    // Simple heuristic parser for query
    const lower = text.toLowerCase();
    if (lower.includes('laptop') || lower.includes('macbook')) {
      setDescription('Workstation Laptop');
      setRequestType('equipment');
      if (amount === '') setAmount(1200);
    } else if (lower.includes('tuition') || lower.includes('course')) {
      setDescription('Tuition Fee Payment');
      setRequestType('education');
      if (amount === '') setAmount(30000);
    } else if (lower.includes('family') || lower.includes('send money')) {
      setDescription('Family Support Fund');
      setRequestType('family_support');
      if (amount === '') setAmount(500);
    } else if (lower.includes('vacation') || lower.includes('trip') || lower.includes('travel')) {
      setDescription('Holiday Vacation Booking');
      setRequestType('travel');
      if (amount === '') setAmount(1500);
    } else if (lower.includes('invest')) {
      setDescription('Investment Deposit');
      setRequestType('investment');
      if (amount === '') setAmount(2000);
    }

    // Extract numbers if present in text
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
        currency: currency,
        desired_completion_date: completionDate,
        request_type: requestType,
        allows_partial_payment: allowsPartial,
        request_date: '2026-09-12'
      });
      onEvaluationComplete(result);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5" />
          Affordability Inquiry Engine
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ask “Buy or Wait”</h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Test whether a planned purchase or financial commitment can be safely afforded without breaching your guaranteed reserves over the next 90 days.
        </p>
      </div>

      {/* Example Prompt Chips */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Quick Example Prompts
        </div>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(p)}
              className="text-xs font-medium bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-slate-700 px-3 py-1.5 rounded-lg transition-all text-left flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              <span>{p.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Request Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        {/* Natural Language Box */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Natural Language Inquiry
          </label>
          <div className="relative">
            <input
              type="text"
              value={naturalQuery}
              onChange={(e) => handleNaturalQueryChange(e.target.value)}
              placeholder="e.g. Can I afford a $1,200 work laptop before October?"
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
            />
            <Sparkles className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
          </div>
          <p className="text-[11px] text-slate-400">
            Type your request naturally, or refine the structured parameters below.
          </p>
        </div>

        {/* Structured Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Purchase Description */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Purchase Description / Item Name *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Workstation Laptop M3"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Requested Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Requested Amount *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-bold">
                {currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '£'}
              </span>
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Currency *
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="INR">INR - Indian Rupee (₹)</option>
              <option value="USD">USD - United States Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="GBP">GBP - British Pound (£)</option>
            </select>
          </div>

          {/* Desired Completion Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Desired Completion Date *
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400">Must be completed within 90 days of today (2026-09-12).</p>
          </div>

          {/* Request Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Request Category / Type
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="one_time_purchase">One-Time Discretionary Purchase</option>
              <option value="equipment">Work & Productivity Equipment</option>
              <option value="education">Education & Professional Upskilling</option>
              <option value="family_support">Family Support & Transfers</option>
              <option value="travel">Travel & Vacation Booking</option>
              <option value="auto_repair">Automotive & Essential Repair</option>
              <option value="investment">Long-term Investment Contribution</option>
            </select>
          </div>
        </div>

        {/* Partial Payment Toggle */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="font-semibold text-xs text-slate-900">Allow Partial Payment Split</div>
            <div className="text-[11px] text-slate-500">
              Permits paying safe buffer today and completing remainder when future confirmed income arrives.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAllowsPartial(!allowsPartial)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              allowsPartial ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition" />
          </button>
        </div>

        {/* Active Profile Context Banner */}
        <div className="text-xs text-slate-500 bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Evaluating against <strong>{selectedUser?.name}'s</strong> profile: Available{' '}
              <strong>{selectedUser?.home_currency} {selectedUser?.current_balance.toLocaleString()}</strong>, Minimum Reserve{' '}
              <strong>{selectedUser?.home_currency} {selectedUser?.minimum_balance_to_keep.toLocaleString()}</strong>.
            </span>
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={submitting || amount === '' || amount <= 0}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm hover:shadow-emerald-500/20"
        >
          {submitting ? (
            <span>Computing 90-Day Cashflow Projection...</span>
          ) : (
            <>
              <span>Run Deterministic Affordability Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Mandatory Disclaimer */}
      <Disclaimer />
    </div>
  );
};
