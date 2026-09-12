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
import { ShieldCheck, Heart } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeEvaluation, setActiveEvaluation] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize users on mount - Default to Priya Sharma (INR)
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

  // When user changes, pre-load initial recommendation
  useEffect(() => {
    if (selectedUser) {
      // Find initial default request for this user
      const defaultReqId = selectedUser.user_id === 'USR_002' ? 'REQ_003' 
        : selectedUser.user_id === 'USR_003' ? 'REQ_004' 
        : selectedUser.user_id === 'USR_005' ? 'REQ_006' 
        : 'REQ_001';

      fetchEvaluation(defaultReqId).then(res => {
        setActiveEvaluation(res);
      });
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 text-sm font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Initializing Buy or Wait Affordability Agent...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header & Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        users={users}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            selectedUser={selectedUser}
            onSelectRequest={handleSelectRequest}
            onNavigateToAsk={() => setActiveTab('ask')}
          />
        )}

        {activeTab === 'ask' && (
          <AskBuyOrWait
            selectedUser={selectedUser}
            onEvaluationComplete={handleEvaluationComplete}
          />
        )}

        {activeTab === 'recommendation' && (
          <Recommendation
            data={activeEvaluation}
            onNavigateToScenarios={() => setActiveTab('scenarios')}
            onNavigateToAsk={() => setActiveTab('ask')}
          />
        )}

        {activeTab === 'scenarios' && (
          <ScenarioComparison
            data={activeEvaluation}
            onNavigateToRecommendation={() => setActiveTab('recommendation')}
            onNavigateToAsk={() => setActiveTab('ask')}
          />
        )}

        {activeTab === 'timeline' && (
          <FinancialTimeline selectedUser={selectedUser} />
        )}

        {activeTab === 'admin' && <AdminDataView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Buy or Wait</span>
            <span>— AI-Powered Personal Financial Affordability Agent</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>React + TypeScript</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Recharts</span>
            <span>•</span>
            <span>FastAPI Deterministic Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
