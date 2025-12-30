import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PlayerRole, AnswerRow } from '../types';
import { QUESTIONS } from '../constants';
import { db } from '../services/supabase';
import QuestionCard from './QuestionCard';

interface DashboardProps {
  roomId: string;
  userId: string;
  userName: string;
  role: PlayerRole;
  onLeave: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ roomId, userId, userName, role, onLeave }) => {
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshData = useCallback(async (showSyncIndicator = false) => {
    // Only fetch if tab is active (saves thousands of requests on free tier)
    if (document.hidden && !showSyncIndicator) return;

    if (showSyncIndicator) setIsSyncing(true);
    
    try {
      const [answerRes, roomRes] = await Promise.all([
        db.fetchAnswers(roomId),
        db.getRoom(roomId)
      ]);

      if (answerRes.data) {
        setAnswers(answerRes.data);
      }
      
      if (roomRes.data?.guest_id) {
        setPartnerOnline(true);
      }
      setLastSynced(new Date());
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setLoading(false);
      if (showSyncIndicator) {
        // Minimum visual feedback time
        setTimeout(() => setIsSyncing(false), 600);
      }
    }
  }, [roomId]);

  useEffect(() => {
    refreshData();
    
    // Poll every 60 seconds (optimized for long-term play)
    pollTimerRef.current = setInterval(() => {
      refreshData(true);
    }, 60000);

    // Refresh automatically when user returns to tab
    const handleVisibility = () => {
      if (!document.hidden) refreshData(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshData]);

  const handleAnswerSubmit = async (qId: string, text: string) => {
    setIsSyncing(true);
    const { error } = await db.submitAnswer(roomId, userId, qId, text);
    if (!error) {
      await refreshData(true);
    }
    setIsSyncing(false);
  };

  const getAnswerForQuestion = (qId: string) => {
    const myAnswer = answers.find(a => a.question_id === qId && a.user_id === userId);
    const partnerAnswer = answers.find(a => a.question_id === qId && a.user_id !== userId);
    
    return {
      mine: myAnswer?.answer_text || null,
      partner: partnerAnswer?.answer_text || null
    };
  };

  const answeredCount = answers.filter(a => a.user_id === userId).length;
  const revealedCount = QUESTIONS.filter(q => {
    const ans = getAnswerForQuestion(q.id);
    return !!(ans.mine && ans.partner);
  }).length;

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen pb-32 px-4 pt-6 max-w-6xl mx-auto">
      <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 border-b border-zinc-900/50">
        <div className="space-y-4">
          <button 
            onClick={onLeave}
            className="flex items-center gap-2 text-[9px] text-zinc-500 uppercase font-black tracking-widest hover:text-zinc-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Exit Discovery
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-light tracking-[0.1em] text-white uppercase flex items-center">
              Morning<span className="text-pink-500 font-normal">Star</span>
              <span className="text-pink-400 ml-1.5 animate-star text-xs">✦</span>
            </h1>
            <div className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-pink-500">
              {roomId}
            </div>
            <button 
              onClick={() => refreshData(true)}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${
                isSyncing 
                ? 'border-pink-500/50 text-pink-500' 
                : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              <svg className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
              <span className="text-[8px] font-black uppercase tracking-widest">
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-zinc-600 text-[9px] uppercase tracking-widest font-black">
              User: <span className="text-zinc-300">{userName}</span> 
              <span className="mx-2 opacity-20">•</span> 
              {role === 'host' ? 'Host' : 'Guest'}
            </p>
            <span className="text-zinc-800 text-[9px] uppercase tracking-widest font-black">
              Last Sync: <span className="text-zinc-600">{formatTime(lastSynced)}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900/40 px-5 py-3 rounded-2xl border border-zinc-800/50">
            <div className="flex flex-col items-center pr-4 border-r border-zinc-800">
              <span className="text-xl font-bold text-white">{answeredCount}</span>
              <span className="text-[7px] text-zinc-600 uppercase font-black">Solved</span>
            </div>
            <div className="flex flex-col items-center pl-2">
              <span className="text-xl font-bold text-pink-500">{revealedCount}</span>
              <span className="text-[7px] text-pink-500/60 uppercase font-black">Shared</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-4 border-l border-zinc-900">
             <div className={`w-2 h-2 rounded-full ${partnerOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-zinc-800 animate-pulse'}`}></div>
             <span className="text-[9px] text-zinc-700 uppercase font-black tracking-widest">
               {partnerOnline ? 'Partner Linked' : 'Awaiting Link'}
             </span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="w-8 h-8 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
          <div className="text-zinc-700 uppercase tracking-widest text-[10px] font-black animate-pulse">Establishing Connection...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
          {QUESTIONS.map(q => {
            const { mine, partner } = getAnswerForQuestion(q.id);
            return (
              <QuestionCard
                key={q.id}
                question={q}
                answerState={{ userA: mine, userB: partner }}
                playerRole={role === 'host' ? 'userA' : 'userB'}
                onAnswer={(text) => handleAnswerSubmit(q.id, text)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
