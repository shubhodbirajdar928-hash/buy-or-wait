import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Disclaimer: React.FC = () => {
  return (
    <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2 shadow-sm my-4">
      <AlertCircle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
      <div>
        <span className="font-semibold text-slate-700">Financial Decision-Support Notice:</span> Buy or Wait is an AI-powered personal financial simulation and decision-support prototype. It does not constitute certified financial, tax, or investment advice. Projections are computed strictly from supplied historical records, confirmed schedules, and deterministic safety rules.
      </div>
    </div>
  );
};
