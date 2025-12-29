import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PlayerRole, Answer, SyncMessage } from '../types';
import { QUESTIONS, STORAGE_KEY_PREFIX } from '../constants';
import { realtime } from '../services/realtime';
import QuestionCard from './QuestionCard';

interface DashboardProps {
  roomId: string;
  playerRole: PlayerRole;
  userName: string;
  onLeave: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ roomId, playerRole, userName, onLeave }) => {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [partnerActive, setPartnerActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const stateRef = useRef<Record<string, Answer>>({});

  const storageKey = `${STORAGE_KEY_PREFIX}${roomId}`;

  const loadFromStorage = useCallback(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed);
        stateRef.current = parsed;
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
  }, [storageKey]);

  const saveToStorage = useCallback((newAnswers: Record<string, Answer>) => {
    localStorage.setItem(storageKey, JSON.stringify(newAnswers));
    stateRef.current = newAnswers;
    setAnswers({ ...newAnswers });
  }, [storageKey]);

  useEffect(() => {
    realtime.init(roomId);
    loadFromStorage();

    const handleMessage = (msg: SyncMessage) => {
      setPartnerActive(true);

      if (msg.type === 'SUBMIT_ANSWER' && msg.payload.questionId && msg.payload.role && msg.payload.answer) {
        const currentAnswers = { ...stateRef.current };
        const qId = msg.payload.questionId;
        const currentQ = currentAnswers[qId] || { userA: null, userB: null };
        currentAnswers[qId] = { ...currentQ, [msg.payload.role]: msg.payload.answer };
        saveToStorage(currentAnswers);
      } else if (msg.type === 'SYNC_REQUEST') {
        realtime.send({ type: 'SYNC_RESPONSE', payload: { fullState: stateRef.current } });
      } else if (msg.type === 'SYNC_RESPONSE' && msg.payload.fullState) {
        const incoming = msg.payload.fullState;
        const current = { ...stateRef.current };
        Object.keys(incoming).forEach(id => {
          const qIncoming = incoming[id];
          const qCurrent = current[id] || { userA: null, userB: null };
          current[id] = {
            userA: qIncoming.userA || qCurrent.userA,
            userB: qIncoming.userB || qCurrent.userB,
          };
        });
        saveToStorage(current);
      }
    };

    const unsubscribeGlobal = realtime.subscribe(handleMessage);
    const unsubscribeLocal = realtime.listenLocal();

    // Check if we already have partner data locally
    const currentData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const otherRole = playerRole === 'userA' ? 'userB' : 'userA';
    if (Object.values(currentData).some((a: any) => !!a[otherRole])) {
      setPartnerActive(true);
    }

    // Request initial state
    realtime.send({ type: 'SYNC_REQUEST', payload: { userName } });
    
    return () => {
      unsubscribeGlobal();
      unsubscribeLocal();
      realtime.destroy();
    };
  }, [roomId, loadFromStorage, storageKey, playerRole, userName, saveToStorage]);

  const handleAnswerSubmit = (qId: string, answerText: string) => {
    const currentAnswers = { ...stateRef.current };
    const currentQ = currentAnswers[qId] || { userA: null, userB: null };
    currentAnswers[qId] = { ...currentQ, [playerRole]: answerText };
    saveToStorage(currentAnswers);
    
    realtime.send({
      type: 'SUBMIT_ANSWER',
      payload: { questionId: qId, role: playerRole, answer: answerText }
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const answeredCount = QUESTIONS.filter(q => !!answers[q.id]?.[playerRole]).length;
  const revealedCount = QUESTIONS.filter(q => !!(answers[q.id]?.userA && answers[q.id]?.userB)).length;

  return (
    <div className="min-h-screen pb-32 px-4 pt-6 max-w-6xl mx-auto selection:bg-pink-500/20">
      <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 border-b border-zinc-900/50">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-lg font-light tracking-[0.1em] text-white uppercase select-none flex items-center">
              Morning<span className="text-pink-500 font-normal">Star</span>
              <span className="text-pink-400 ml-1.5 animate-star text-xs">✦</span>
            </h1>
            <button 
              onClick={handleCopyCode}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border transition-all flex items-center gap-2 ${
                copied ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-zinc-900 border-zinc-800 text-pink-500 hover:border-pink-500/30'
              }`}
            >
              <span className="font-mono">{roomId}</span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button 
              onClick={onLeave}
              title="Exit Room"
              className="text-zinc-700 hover:text-zinc-400 transition-colors ml-2 p-1 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-black">
            <span className="text-zinc-300">{userName}</span> 
            <span className="mx-2 opacity-20">•</span> 
            {playerRole === 'userA' ? 'Host' : 'Guest'} Entity
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900/40 px-5 py-3 rounded-2xl border border-zinc-800/50">
            <div className="flex flex-col items-center border-r border-zinc-800 pr-4">
              <span className="text-xl font-bold text-white leading-none">{answeredCount}</span>
              <span className="text-[7px] text-zinc-600 uppercase font-black tracking-widest mt-1">Done</span>
            </div>
            <div className="flex flex-col items-center pl-2">
              <span className="text-xl font-bold text-pink-500 leading-none">{revealedCount}</span>
              <span className="text-[7px] text-pink-500/60 uppercase font-black tracking-widest mt-1">Shared</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-4 border-l border-zinc-900 ml-2">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${partnerActive ? 'bg-green-500 shadow-green-500/20' : 'bg-zinc-800 animate-pulse'}`}></div>
            <span className="text-[9px] text-zinc-700 uppercase font-black tracking-widest">
              {partnerActive ? 'Partner Online' : 'Finding Partner...'}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {QUESTIONS.map(question => (
          <QuestionCard
            key={question.id}
            question={question}
            answerState={answers[question.id] || { userA: null, userB: null }}
            playerRole={playerRole}
            onAnswer={(text) => handleAnswerSubmit(question.id, text)}
          />
        ))}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900/50 text-center z-10">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-zinc-900"></span>
          <p className="text-zinc-800 text-[9px] uppercase tracking-[0.5em] font-black">
            MorningStar Revelation Protocol
          </p>
          <span className="h-px w-8 bg-zinc-900"></span>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;