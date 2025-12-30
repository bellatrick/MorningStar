import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PlayerRole, AnswerRow, Question } from '../types';
import { QUESTIONS } from '../constants';
import { db } from '../services/supabase';
import QuestionCard from './QuestionCard';
import { useToast } from './ToastProvider';

interface DashboardProps {
  roomId: string;
  userId: string;
  userName: string;
  role: PlayerRole;
  onLeave: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ roomId, userId, userName, role, onLeave }) => {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [questions, setQuestions] = useState<Question[]>(QUESTIONS);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadQuestions = useCallback(async () => {
    const { data, error } = await db.getAllQuestions();
    if (data && !error && data.length > 0) {
      setQuestions(data);
    }
    // Fallback to static questions if DB unavailable
  }, []);

  const refreshData = useCallback(async (showSyncIndicator = false) => {
    if (document.hidden && !showSyncIndicator) return;
    if (showSyncIndicator) setIsSyncing(true);

    try {
      const [answerRes, roomRes, questionsRes] = await Promise.all([
        db.fetchAnswers(roomId),
        db.getRoom(roomId),
        db.getAllQuestions()
      ]);

      if (answerRes.data) setAnswers(answerRes.data);
      if (roomRes.data?.guest_id) setPartnerOnline(true);
      if (questionsRes.data && questionsRes.data.length > 0) setQuestions(questionsRes.data);
      setLastSynced(new Date());
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setLoading(false);
      if (showSyncIndicator) setTimeout(() => setIsSyncing(false), 600);
    }
  }, [roomId]);

  useEffect(() => {
    refreshData();
    pollTimerRef.current = setInterval(() => refreshData(true), 60000);
    const handleVisibility = () => { if (!document.hidden) refreshData(true); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshData]);

  const handleAnswerSubmit = async (qId: string, text: string) => {
    setIsSyncing(true);
    const { error } = await db.submitAnswer(roomId, userId, qId, text);
    if (!error) await refreshData(true);
    setIsSyncing(false);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    setIsSyncing(true);
    const { error } = await db.submitQuestion(newQuestionText.trim(), userId);
    if (!error) {
      await loadQuestions();
      setNewQuestionText('');
      setShowQuestionForm(false);
      toast.success("Question submitted!");
    } else {
      toast.error('Failed to submit question');
    }
    setIsSyncing(false);
  };

  const getAnswerForQuestion = (qId: string) => {
    const myAnswer = answers.find(a => a.question_id === qId && a.user_id === userId);
    const partnerAnswer = answers.find(a => a.question_id === qId && a.user_id !== userId);
    return { mine: myAnswer?.answer_text || null, partner: partnerAnswer?.answer_text || null };
  };

  const answeredCount = answers.filter(a => a.user_id === userId).length;
  const revealedCount = QUESTIONS.filter(q => {
    const ans = getAnswerForQuestion(q.id);
    return !!(ans.mine && ans.partner);
  }).length;

  const formatTime = (date: Date | null) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

  return (
    <div className="ms-container" style={{ paddingBottom: '8rem' }}>
      <header className="animate-in" style={{ marginBottom: '3rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
          <div>
            <button onClick={onLeave} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', marginBottom: '1rem', letterSpacing: '0.1em' }}>
              ← Exit Discovery
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1 className="ms-logo" style={{ fontSize: '1.2rem', margin: 0 }}>Morning<span>Star</span><span className="ms-star-icon" style={{ fontSize: '1rem' }}>✦</span></h1>
              <button
                className="ms-badge"
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  toast.success("Room code copied!");
                }}
                title="Click to copy"
                style={{
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  background: 'rgba(236, 72, 153, 0.1)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  transition: 'all 0.2s ease',
                  fontSize: '0.7rem'
                }}
              >
                {roomId} 
              </button>
              <button
                onClick={() => refreshData(true)}
                disabled={isSyncing}
                style={{ background: 'none', border: '1px solid var(--surface-border)', borderRadius: '0.5rem', color: isSyncing ? 'var(--primary-color)' : 'var(--text-dim)', fontSize: '0.6rem', padding: '0.25rem 0.5rem', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 800 }}
              >
                {isSyncing ? 'Syncing...' : 'Sync'}
              </button>
              <button
                onClick={() => setShowQuestionForm(!showQuestionForm)}
                className="ms-btn-secondary"
                style={{ fontSize: '0.6rem', padding: '0.25rem 0.75rem' }}
              >
                + Add Question
              </button>
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.6rem', color: 'var(--text-dark)', fontWeight: 900, textTransform: 'uppercase' }}>
              <span>User: <span style={{ color: 'var(--text-dim)' }}>{userName}</span></span>
              <span>Role: <span style={{ color: 'var(--text-dim)' }}>{role}</span></span>
              <span>Last Sync: <span style={{ color: 'var(--text-dim)' }}>{formatTime(lastSynced)}</span></span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
             <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1.25rem', borderRadius: '1rem', border: '1px solid var(--surface-border)', display: 'flex', gap: '1rem' }}>
                <div style={{ textAlign: 'center', paddingRight: '1rem', borderRight: '1px solid var(--surface-border)' }}>
                   <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{answeredCount}</div>
                   <div style={{ fontSize: '0.5rem', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Solved</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>{revealedCount}</div>
                   <div style={{ fontSize: '0.5rem', color: 'var(--primary-color)', opacity: 0.6, textTransform: 'uppercase' }}>Shared</div>
                </div>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: partnerOnline ? '#22c55e' : '#27272a' }}></div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dark)', fontWeight: 900, textTransform: 'uppercase' }}>{partnerOnline ? 'Partner Linked' : 'Awaiting Link'}</span>
             </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '1rem' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid rgba(236, 72, 153, 0.2)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'star-pulse 1s infinite linear' }}></div>
          <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-dark)' }}>Connecting...</span>
        </div>
      ) : (
        <div className="ms-grid animate-in">
          {questions.map((q, i) => {
            const { mine, partner } = getAnswerForQuestion(q.id);
            return (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                myAnswer={mine}
                partnerAnswer={partner}
                onAnswer={(text) => handleAnswerSubmit(q.id, text)}
              />
            );
          })}
        </div>
      )}

      {showQuestionForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1.5rem' }}>
          <div className="ms-card animate-in" style={{ width: '100%', maxWidth: '400px', border: '1px solid var(--primary-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 300, marginBottom: '1.5rem' }}>Propose a Question</h3>
            <form onSubmit={handleQuestionSubmit}>
              <textarea
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Type your question here to share with everyone..."
                className="ms-input"
                autoFocus
                maxLength={200}
                style={{ minHeight: '100px', marginBottom: '1.5rem', resize: 'none', fontSize: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowQuestionForm(false)}
                  className="ms-btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newQuestionText.trim() || isSyncing}
                  className="ms-btn-primary"
                  style={{ flex: 1 }}
                >
                  {isSyncing ? 'Submitting...' : 'Submit Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;