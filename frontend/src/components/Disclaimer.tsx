import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const Disclaimer: React.FC = () => (
  <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl text-xs text-slate-500" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <AlertTriangle className="w-4 h-4 text-amber-500/70 flex-shrink-0 mt-0.5" />
    <span>
      <span className="font-semibold text-slate-400">Financial Decision-Support Notice: </span>
      Buy or Wait is an AI-powered personal financial simulation prototype. It does not constitute certified financial, tax, or investment advice. All projections are computed strictly from supplied historical records, confirmed schedules, and deterministic safety rules.
    </span>
  </div>
);
