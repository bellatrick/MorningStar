import React, { useState, useEffect } from 'react';
import { db } from '../services/supabase';
import { RoomRow, Question } from '../types';
import { useToast } from './ToastProvider';

const RIDDLE = "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?";
const ANSWER = "echo"; // Case-insensitive

const ConfirmModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1.5rem' }}>
      <div className="ms-card animate-in" style={{ width: '100%', maxWidth: '350px', border: '1px solid var(--primary-color)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 300, marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onCancel} className="ms-btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={onConfirm} className="ms-btn-primary" style={{ flex: 1, background: '#ef4444' }}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

const Admin: React.FC = () => {
  const { toast } = useToast();
  const [authenticated, setAuthenticated] = useState(false);
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const [activeTab, setActiveTab] = useState<'rooms' | 'questions'>('rooms');

  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const [confirmState, setConfirmState] = useState<{ id: string, type: 'room' | 'question' } | null>(null);

  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated, activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'rooms') {
      const { data, error } = await db.getAllRooms();
      if (data && !error) setRooms(data);
    } else {
      const { data, error } = await db.getAllQuestions();
      if (data && !error) setQuestions(data);
    }
    setLoading(false);
  };

  const handleRiddleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (riddleAnswer.trim().toLowerCase() === ANSWER) {
      setAuthenticated(true);
      toast.success("Correct! Welcome, Admin.");
    } else {
      toast.error("Incorrect! Think harder... 🤔");
      setRiddleAnswer('');
    }
  };

  const confirmDelete = () => {
    if (!confirmState) return;
    if (confirmState.type === 'room') handleDeleteRoom(confirmState.id);
    else handleDeleteQuestion(confirmState.id);
    setConfirmState(null);
  };

  const handleDeleteRoom = async (roomId: string) => {
    const { error } = await db.deleteRoom(roomId);
    if (!error) {
      setRooms(rooms.filter(r => r.id !== roomId));
      toast.success(`Deleted room ${roomId}`);
    } else {
      toast.error("Failed to delete room");
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    const { error } = await db.deleteQuestion(qId);
    if (!error) {
      setQuestions(questions.filter(q => q.id !== qId));
      toast.success("Question deleted");
    } else {
      toast.error("Failed to delete question");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getInactiveRooms = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return rooms.filter(r => r.created_at && new Date(r.created_at) < oneDayAgo);
  };

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="animate-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 className="ms-logo">Morning<span>Star</span><span className="ms-star-icon">✦</span></h1>
          <div className="ms-badge" style={{ display: 'inline-block', opacity: 0.6, marginTop: '1rem' }}>Admin Access</div>
        </div>

        <div className="ms-card animate-in" style={{ width: '100%', maxWidth: '500px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 300, marginBottom: '1.5rem', textAlign: 'center' }}>{RIDDLE}</h3>
          <form onSubmit={handleRiddleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              required
              autoFocus
              value={riddleAnswer}
              onChange={(e) => setRiddleAnswer(e.target.value)}
              placeholder="Your answer..."
              className="ms-input"
              style={{ textAlign: 'center' }}
            />
            <button type="submit" className="ms-btn-primary">Submit Answer</button>
          </form>
        </div>
      </div>
    );
  }

  const inactiveRooms = getInactiveRooms();

  return (
    <div className="ms-container" style={{ paddingBottom: '4rem' }}>
      <ConfirmModal
        isOpen={!!confirmState}
        title={confirmState?.type === 'room' ? 'Delete Room?' : 'Delete Question?'}
        message={confirmState?.type === 'room' ? 'This will permanently remove the room and all its answers.' : 'This question will be removed for all users immediately.'}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmState(null)}
      />

      <header className="animate-in" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="ms-logo" style={{ fontSize: '1.2rem', margin: 0 }}>Morning<span>Star</span><span className="ms-star-icon" style={{ fontSize: '1rem' }}>✦</span></h1>
            <span className="ms-badge" style={{ marginTop: '0.5rem', display: 'inline-block' }}>Admin Panel</span>
          </div>
          <button onClick={loadData} disabled={loading} className="ms-btn-secondary" style={{ fontSize: '0.7rem' }}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setActiveTab('rooms')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'rooms' ? 'var(--primary-color)' : 'var(--text-dim)',
            fontWeight: 900,
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderBottom: activeTab === 'rooms' ? '2px solid var(--primary-color)' : '2px solid transparent',
            paddingBottom: '0.5rem'
          }}
        >
          Active Rooms ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'questions' ? 'var(--primary-color)' : 'var(--text-dim)',
            fontWeight: 900,
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderBottom: activeTab === 'questions' ? '2px solid var(--primary-color)' : '2px solid transparent',
            paddingBottom: '0.5rem'
          }}
        >
          Question Pool
        </button>
      </div>

      {activeTab === 'rooms' && (
        <>
          <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="ms-card" style={{ flex: '1 1 200px', background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Inactive (24h+)</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>{inactiveRooms.length}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rooms.length === 0 ? <div className="ms-card" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>No rooms found</div> :
              rooms.map(room => {
                const isInactive = inactiveRooms.some(r => r.id === room.id);
                return (
                  <div key={room.id} className="ms-card" style={{
                    background: isInactive ? 'rgba(236, 72, 153, 0.05)' : 'rgba(0,0,0,0.3)',
                    border: isInactive ? '1px solid rgba(236, 72, 153, 0.2)' : '1px solid var(--surface-border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                          <span className="ms-badge" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>{room.id}</span>
                          {isInactive && <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Inactive</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', fontSize: '0.7rem' }}>
                          <span style={{ color: 'var(--text-dark)', fontWeight: 900, textTransform: 'uppercase' }}>Host:</span><span style={{ fontFamily: 'monospace', opacity: 0.8 }}>{room.host_id}</span>
                          <span style={{ color: 'var(--text-dark)', fontWeight: 900, textTransform: 'uppercase' }}>Created:</span><span>{formatDate(room.created_at)}</span>
                        </div>
                      </div>
                      <button onClick={() => setConfirmState({ id: room.id, type: 'room' })} className="ms-btn-secondary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.6rem' }}>Delete</button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </>
      )}

      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map(q => (
             <div key={q.id} className="ms-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
               <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>ID: {q.id}</div>
                  <div style={{ fontSize: '1rem' }}>{q.text}</div>
               </div>
               <button onClick={() => setConfirmState({ id: q.id, type: 'question' })} className="ms-btn-secondary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '1rem', padding: '0.5rem 0.75rem' }}>×</button>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
