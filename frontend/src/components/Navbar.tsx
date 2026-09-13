import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Clock, Database, ChevronDown, Home, GitCompare } from 'lucide-react';
import { UserProfile } from '../types';

const navLinks = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'ask', label: 'Ask AI', icon: Sparkles, highlight: true },
  { id: 'recommendation', label: 'Decision', icon: ShieldCheck },
  { id: 'scenarios', label: 'Scenarios', icon: GitCompare },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'admin', label: 'Data', icon: Database },
];

const currencyFlag: Record<string, string> = { INR: '🇮🇳', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧' };

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  users: UserProfile[];
  selectedUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, users, selectedUser, onSelectUser }) => {
  const [userDropOpen, setUserDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      style={{
        background: 'rgba(8,13,26,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}
            >
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Buy or Wait
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md tracking-wider" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>AI</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Personal Affordability Agent</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ id, label, icon: Icon, highlight }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={isActive
                    ? { background: highlight ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)', color: highlight ? '#10b981' : '#e2e8f0', border: `1px solid ${highlight ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.1)'}` }
                    : { color: '#64748b', border: '1px solid transparent' }}
                >
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setUserDropOpen(!userDropOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#10b981,#0284c7)', color: '#fff' }}>
                  {selectedUser?.name.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 leading-none">{currencyFlag[selectedUser?.home_currency || ''] || '🌐'} {selectedUser?.name || 'Select User'}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{selectedUser?.home_currency} · {selectedUser?.user_id}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 transition-transform" style={{ transform: userDropOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>

              {userDropOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl py-2 z-[100]"
                  style={{ background: 'rgba(14,20,36,0.97)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.7)', backdropFilter: 'blur(24px)' }}>
                  <div className="px-4 py-2 border-b border-white/5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Switch Profile</div>
                  {users.map(u => {
                    const isSel = selectedUser?.user_id === u.user_id;
                    return (
                      <button key={u.user_id} onClick={() => { onSelectUser(u); setUserDropOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                        style={{ background: isSel ? 'rgba(16,185,129,0.1)' : 'transparent' }}
                        onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: isSel ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.08)', color: isSel ? '#fff' : '#94a3b8' }}>
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-200">{u.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">{u.home_currency} {u.current_balance.toLocaleString()} · Reserve {u.minimum_balance_to_keep.toLocaleString()}</div>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md font-mono" style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>{currencyFlag[u.home_currency] || ''} {u.home_currency}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button className="md:hidden p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setMobileOpen(!mobileOpen)}>
              <div className="w-4 h-3 flex flex-col justify-between">
                <span className="w-full h-0.5 bg-slate-400 rounded" />
                <span className="w-full h-0.5 bg-slate-400 rounded" />
                <span className="w-full h-0.5 bg-slate-400 rounded" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t py-2 px-4 flex flex-wrap gap-1.5" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,13,26,0.95)' }}>
          {navLinks.map(({ id, label, icon: Icon, highlight }) => {
            const isActive = activeTab === id;
            return (
              <button key={id} onClick={() => { setActiveTab(id); setMobileOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: isActive ? (highlight ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.09)') : 'rgba(255,255,255,0.04)', color: isActive ? (highlight ? '#10b981' : '#e2e8f0') : '#64748b', border: `1px solid ${isActive ? 'rgba(255,255,255,0.12)' : 'transparent'}` }}>
                <Icon className="w-3 h-3" /> {label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
