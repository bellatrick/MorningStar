import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import { ToastProvider, useToast } from './components/ToastProvider';
import { PlayerRole, RoomRow } from './types';
import { db } from './services/supabase';

const STORAGE_USER_ID = 'morningstar_uid';
const STORAGE_USER_NAME = 'morningstar_uname';

const MainApp: React.FC = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [activeRooms, setActiveRooms] = useState<RoomRow[]>([]);
  const [role, setRole] = useState<PlayerRole | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'landing' | 'onboarding' | 'lobby'>('landing');
  const [showAdmin, setShowAdmin] = useState(false);

  // Recovery State
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryId, setRecoveryId] = useState('');

  // Check for admin route
  useEffect(() => {
    const checkAdminRoute = () => {
      setShowAdmin(window.location.hash === '#admin');
    };
    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    return () => window.removeEventListener('hashchange', checkAdminRoute);
  }, []);

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

  useEffect(() => {
    if (userId && view === 'landing') {
      const fetchRooms = async () => {
        const { data } = await db.getUserRooms(userId);
        if (data) setActiveRooms(data);
      };
      fetchRooms();
    }
  }, [userId, view]);

  const handleResumeRoom = (room: RoomRow) => {
    setRoomId(room.id);
    const userRole = room.host_id === userId ? 'host' : 'guest';
    setRole(userRole);
    setIsJoined(true);
    toast.success(`Resumed session: ${room.id}`);
  };

  const handleCreateRoom = async () => {
    if (!userName) {
      setRole('host');
      setView('onboarding');
      return;
    }
    setLoading(true);
    const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await db.createRoom(newRoom, userId, userName);
    if (!error) {
      setRoomId(newRoom);
      setRole('host');
      setIsJoined(true);
    } else {
      console.error(error);
      toast.error("Failed to create room.");
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
        await db.joinRoom(room.id, userId, userName);
        setRole('guest');
        setIsJoined(true);
      } else {
        toast.error("Room is full.");
      }
    } else {
      toast.error("Room not found. Check the code.");
    }
    setLoading(false);
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem(STORAGE_USER_NAME, userName.trim());
      if (role === 'host') handleCreateRoom();
      else if (role === 'guest') handleJoinRoom(e);
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryId.trim()) {
      const recoveredId = recoveryId.trim();
      setUserId(recoveredId);
      localStorage.setItem(STORAGE_USER_ID, recoveredId);

      // Reset state to refresh
      setShowRecovery(false);
      setRecoveryId('');
      toast.success("Identity restored.");

      // Trigger room fetch is automatic via useEffect [userId]
    }
  };

  const handleBackToLanding = () => {
    setView('landing');
    setRole(null);
  };

  if (showAdmin) {
    return <Admin />;
  }

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
          {db.isCloud() ? (
            <span>Cloud Sync Active • {activeRooms.length} Sessions</span>
          ) : 'Local Discovery Mode'}
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

            {activeRooms.length > 0 && (
              <div className="animate-in" style={{ marginTop: '1rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
                <h3 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '1rem', letterSpacing: '0.1em' }}>
                  Active Sessions ({activeRooms.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {activeRooms.map(room => {
                    const myRole = room.host_id === userId ? 'Host' : 'Guest';
                    return (
                      <div key={room.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.1em' }}>{room.id}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Role: {myRole}</div>
                        </div>
                        <button
                          onClick={() => handleResumeRoom(room)}
                          className="ms-btn-primary"
                          style={{ fontSize: '0.6rem', padding: '0.4rem 0.8rem', width: 'auto' }}
                        >
                          Resume →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

      {view === 'landing' && (
        <button
          onClick={() => setShowRecovery(true)}
          style={{ marginTop: '2rem', background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Lost access? Enter User ID manually
        </button>
      )}

      {/* Recovery Modal */}
      {showRecovery && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1.5rem' }}>
            <div className="ms-card animate-in" style={{ width: '100%', maxWidth: '350px', border: '1px solid var(--primary-color)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 300, marginBottom: '0.5rem' }}>Restore Identity</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Enter your User ID to regain access to your previous sessions.</p>

              <form onSubmit={handleRecoverySubmit}>
                <input
                  type="text"
                  required
                  autoFocus
                  value={recoveryId}
                  onChange={(e) => setRecoveryId(e.target.value)}
                  placeholder="e.g. j9k2ms..."
                  className="ms-input"
                  style={{ marginBottom: '1rem', fontFamily: 'monospace' }}
                />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowRecovery(false)} className="ms-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="ms-btn-primary" style={{ flex: 1 }}>Restore</button>
                </div>
              </form>
            </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
};

export default App;