import React from 'react';
import { ShieldCheck, User, Sparkles, SlidersHorizontal, Clock, Database, ChevronDown } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  users: UserProfile[];
  selectedUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  users,
  selectedUser,
  onSelectUser,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                Buy or Wait
                <span className="text-[10px] uppercase font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded tracking-wider">
                  AI Agent
                </span>
              </span>
              <p className="text-xs text-slate-500 hidden sm:block">Deterministic Financial Affordability Guard</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('ask')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'ask'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Ask Buy or Wait
            </button>
            <button
              onClick={() => setActiveTab('recommendation')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'recommendation'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Recommendation
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
                activeTab === 'scenarios'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Scenarios
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
                activeTab === 'admin'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Admin / Data
            </button>
          </nav>

          {/* User Selector Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
                  {selectedUser?.name.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 leading-none">
                    {selectedUser?.name || 'Select User'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {selectedUser?.home_currency} ({selectedUser?.user_id})
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 hidden group-hover:block animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Profile
                </div>
                {users.map((u) => (
                  <button
                    key={u.user_id}
                    onClick={() => onSelectUser(u)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      selectedUser?.user_id === u.user_id ? 'bg-emerald-50/60 font-semibold text-emerald-900' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-500">
                        Balance: {u.home_currency} {u.current_balance.toLocaleString()} | Reserve: {u.home_currency} {u.minimum_balance_to_keep.toLocaleString()}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {u.home_currency}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile nav bar */}
      <div className="md:hidden flex overflow-x-auto border-t border-slate-200 px-4 py-2 gap-1 custom-scrollbar">
        {['dashboard', 'ask', 'recommendation', 'scenarios', 'timeline', 'admin'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap capitalize ${
              activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab === 'ask' ? 'Ask Buy or Wait' : tab}
          </button>
        ))}
      </div>
    </header>
  );
};
