import React, { useEffect, useState, useCallback } from 'react';
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
  const [partnerOnline, setPartnerOnline] = useState(false);

  const refreshData = useCallback(async () => {
    const { data: answerData } = await db.fetchAnswers(roomId);
    if (answerData) {
      setAnswers(answerData);
    }
    
    const { data: roomData } = await db.getRoom(roomId);
    if (roomData?.guest_id) {
      setPartnerOnline(true);
    }
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    refreshData();
    // Poll every 30 seconds for new answers
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleAnswerSubmit = async (qId: string, text: string) => {
    const { error } = await db.submitAnswer(roomId, userId, qId, text);
    if (!error) {
      refreshData(); // Refresh immediately after submitting
    }
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
          </div>
          <p className="text-zinc-600 text-[9px] uppercase tracking-widest font-black">
            User: <span className="text-zinc-300">{userName}</span> 
            <span className="mx-2 opacity-20">•</span> 
            {role === 'host' ? 'Host' : 'Guest'} Protocol
          </p>
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
               {partnerOnline ? 'Partner Active' : 'Waiting...'}
             </span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-zinc-700 uppercase tracking-widest text-xs animate-pulse">Syncing Galaxy...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {QUESTIONS.map(q => {
            const { mine, partner } = getAnswerForQuestion(q.id);
            return (
              <QuestionCard
                key={q.id}
                question={q}
                answerState={{ userA: mine, userB: partner }}
                playerRole="userA" // In this unified component, userA always maps to "Me"
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