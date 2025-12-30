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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-transparent">
      <div className="mb-12 text-center animate-in fade-in zoom-in duration-1000">
        <h1 className="text-3xl font-light tracking-[0.2em] text-white uppercase flex items-center justify-center">
          Morning<span className="text-pink-500 font-normal">Star</span>
          <span className="text-pink-400 ml-2 animate-star text-2xl">✦</span>
        </h1>
        <div className="mt-4 px-4 py-1.5 bg-zinc-900/40 border border-zinc-800/60 rounded-full inline-block">
          <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">
            {db.isCloud() ? 'Cloud Sync Active' : 'Local Discovery Mode'}
          </span>
        </div>
      </div>

      <div className="w-full max-sm:px-0 max-w-sm bg-zinc-900/40 border border-zinc-800/60 p-10 sm:p-12 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
        {view === 'landing' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full py-5 bg-white text-black font-bold text-[11px] tracking-[0.2em] uppercase rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Establishing...' : 'Initiate Discovery'}
            </button>
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-grow bg-zinc-800"></div>
              <span className="text-[10px] text-zinc-600 font-black uppercase">OR</span>
              <div className="h-px flex-grow bg-zinc-800"></div>
            </div>
            <button
              onClick={() => setView('lobby')}
              className="w-full py-5 border border-zinc-800 text-zinc-400 font-bold text-[11px] tracking-[0.2em] uppercase rounded-2xl transition-all hover:border-zinc-700 hover:text-white"
            >
              Join Existing Space
            </button>
          </div>
        )}

        {view === 'onboarding' && (
          <div className="animate-in fade-in slide-in-from-right-4">
             <button 
              onClick={handleBackToLanding}
              className="mb-8 flex items-center gap-2 text-[9px] text-zinc-500 uppercase font-black tracking-widest hover:text-zinc-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Go Back
            </button>
            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Identity Tag</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter a username..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-pink-500/50 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-pink-600 text-white font-bold text-[11px] tracking-[0.2em] uppercase rounded-2xl transition-all hover:bg-pink-500"
              >
                Confirm Identity
              </button>
            </form>
          </div>
        )}

        {view === 'lobby' && (
          <div className="animate-in fade-in slide-in-from-left-4">
            <button 
              onClick={handleBackToLanding}
              className="mb-8 flex items-center gap-2 text-[9px] text-zinc-500 uppercase font-black tracking-widest hover:text-zinc-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Go Back
            </button>
            <form onSubmit={handleJoinRoom} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Room Code</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="E.G. XJ92LK"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-white font-mono text-center text-2xl tracking-[0.3em] focus:outline-none focus:border-pink-500/50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-white text-black font-bold text-[11px] tracking-[0.2em] uppercase rounded-2xl transition-all disabled:opacity-50"
              >
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