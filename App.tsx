import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { PlayerRole } from './types';
import { db } from './services/supabase';

const STORAGE_USER_ID = 'morningstar_uid';
const STORAGE_USER_NAME = 'morningstar_uname';

const App: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [role, setRole] = useState<PlayerRole | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'landing' | 'onboarding' | 'lobby'>('landing');

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_USER_ID);
    const savedName = localStorage.getItem(STORAGE_USER_NAME);
    if (savedId && savedName) {
      setUserId(savedId);
      setUserName(savedName);
    } else {
      const newId = Math.random().toString(36).substring(2, 15);
      setUserId(newId);
      localStorage.setItem(STORAGE_USER_ID, newId);
    }
  }, []);

  const handleCreateRoom = async () => {
    if (!userName) {
      setRole('host');
      setView('onboarding');
      return;
    }
    setLoading(true);
    const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await db.createRoom(newRoom, userId);
    if (!error) {
      setRoomId(newRoom);
      setRole('host');
      setIsJoined(true);
    } else {
      console.error(error);
      alert("Failed to create room.");
    }
    setLoading(false);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName) {
      setRole('guest');
      setView('onboarding');
      return;
    }
    setLoading(true);
    const { data: room, error } = await db.getRoom(roomId.toUpperCase());
    if (room && !error) {
      if (room.host_id === userId) {
        setRole('host');
        setIsJoined(true);
      } else if (!room.guest_id || room.guest_id === userId) {
        await db.joinRoom(room.id, userId);
        setRole('guest');
        setIsJoined(true);
      } else {
        alert("Room is full.");
      }
    } else {
      alert("Room not found. Check the code.");
    }
    setLoading(false);
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem(STORAGE_USER_NAME, userName.trim());
      if (role === 'host') handleCreateRoom();
      else setView('lobby');
    }
  };

  const handleBackToLanding = () => {
    setView('landing');
    setRole(null);
  };

  if (isJoined && role) {
    return <Dashboard roomId={roomId} userId={userId} userName={userName} role={role} onLeave={() => setIsJoined(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="animate-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="ms-logo">
          Morning<span>Star</span>
          <span className="ms-star-icon">✦</span>
        </h1>
        <div className="ms-badge" style={{ display: 'inline-block', opacity: 0.6 }}>
          {db.isCloud() ? 'Cloud Sync Active' : 'Local Discovery Mode'}
        </div>
      </div>

      <div className="ms-card animate-in" style={{ width: '100%', maxWidth: '400px' }}>
        {view === 'landing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="ms-btn-primary"
            >
              {loading ? 'Establishing...' : 'Initiate Discovery'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
              <div style={{ height: '1px', flexGrow: 1, background: 'var(--surface-border)' }}></div>
              <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-dark)' }}>OR</span>
              <div style={{ height: '1px', flexGrow: 1, background: 'var(--surface-border)' }}></div>
            </div>
            <button
              onClick={() => setView('lobby')}
              className="ms-btn-secondary"
            >
              Join Existing Space
            </button>
          </div>
        )}

        {view === 'onboarding' && (
          <div className="animate-in">
             <button onClick={handleBackToLanding} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.7rem', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 800, textTransform: 'uppercase' }}>
               ← Go Back
             </button>
            <form onSubmit={handleUsernameSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>Identity Tag</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter a username..."
                  className="ms-input"
                />
              </div>
              <button type="submit" className="ms-btn-primary" style={{ background: 'var(--primary-color)', color: 'white' }}>
                Confirm Identity
              </button>
            </form>
          </div>
        )}

        {view === 'lobby' && (
          <div className="animate-in">
            <button onClick={handleBackToLanding} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.7rem', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 800, textTransform: 'uppercase' }}>
               ← Go Back
             </button>
            <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>Room Code</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="XJ92LK"
                  className="ms-input"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em', fontFamily: 'monospace' }}
                />
              </div>
              <button type="submit" disabled={loading} className="ms-btn-primary">
                Enter Shared Discovery
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;