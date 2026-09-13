import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { AskBuyOrWait } from './pages/AskBuyOrWait';
import { Recommendation } from './pages/Recommendation';
import { ScenarioComparison } from './pages/ScenarioComparison';
import { FinancialTimeline } from './pages/FinancialTimeline';
import { AdminDataView } from './pages/AdminDataView';
import { UserProfile, EvaluationResponse } from './types';
import { fetchUsers, fetchEvaluation } from './services/api';
import { ShieldCheck } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeEvaluation, setActiveEvaluation] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchUsers().then(uList => {
      setUsers(uList);
      if (uList.length > 0) {
        const inrUser = uList.find(u => u.home_currency === 'INR') || uList[0];
        setSelectedUser(inrUser);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const defaultReqId = selectedUser.user_id === 'USR_002' ? 'REQ_003'
        : selectedUser.user_id === 'USR_003' ? 'REQ_004'
        : selectedUser.user_id === 'USR_005' ? 'REQ_006'
        : 'REQ_001';
      fetchEvaluation(defaultReqId).then(res => setActiveEvaluation(res));
    }
  }, [selectedUser]);

  const handleSelectRequest = (requestId: string) => {
    fetchEvaluation(requestId).then(res => {
      setActiveEvaluation(res);
      setActiveTab('recommendation');
    });
  };

  const handleEvaluationComplete = (result: EvaluationResponse) => {
    setActiveEvaluation(result);
    setActiveTab('recommendation');
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center pulse-ring" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 0 0 0 rgba(16,185,129,0.4)' }}>
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">Buy or Wait</div>
            <div className="text-sm text-slate-500 mt-1">Initializing Affordability Agent...</div>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-emerald-500/60" style={{ animation: `bounce 1.4s ease-in-out ${i*0.2}s infinite` }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} users={users} selectedUser={selectedUser} onSelectUser={setSelectedUser} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard selectedUser={selectedUser} onSelectRequest={handleSelectRequest} onNavigateToAsk={() => setActiveTab('ask')} />}
        {activeTab === 'ask' && <AskBuyOrWait selectedUser={selectedUser} onEvaluationComplete={handleEvaluationComplete} />}
        {activeTab === 'recommendation' && <Recommendation data={activeEvaluation} onNavigateToScenarios={() => setActiveTab('scenarios')} onNavigateToAsk={() => setActiveTab('ask')} />}
        {activeTab === 'scenarios' && <ScenarioComparison data={activeEvaluation} onNavigateToRecommendation={() => setActiveTab('recommendation')} onNavigateToAsk={() => setActiveTab('ask')} />}
        {activeTab === 'timeline' && <FinancialTimeline selectedUser={selectedUser} />}
        {activeTab === 'admin' && <AdminDataView />}
      </main>
      <footer className="py-6 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-400">Buy or Wait</span>
            <span>— AI-Powered Personal Financial Affordability Agent</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span>React 19 + TypeScript</span><span>·</span>
            <span>Tailwind CSS</span><span>·</span>
            <span>Recharts</span><span>·</span>
            <span>FastAPI Deterministic Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
