import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { PlayerRole, SyncMessage } from './types';
import { realtime } from './services/realtime';
import { STORAGE_KEY_PREFIX } from './constants';

type ViewState = 'choice' | 'setup';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('choice');
  const [roomId, setRoomId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [playerRole, setPlayerRole] = useState<PlayerRole | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [roomExists, setRoomExists] = useState<boolean | null>(null);

  useEffect(() => {
    const syncSession = () => {
      const hash = window.location.hash.replace('#', '').toUpperCase();
      if (hash) {
        const savedName = localStorage.getItem('morningstar_user_name');
        const savedRole = localStorage.getItem(`morningstar_role_${hash}`);
        
        if (savedName && savedRole) {
          setRoomId(hash);
          setUserName(savedName);
          setPlayerRole(savedRole as PlayerRole);
          setIsJoined(true);
        } else if (!isJoined) {
          setRoomId(hash);
        }
      } else {
        setIsJoined(false);
        setView('choice');
      }
    };

    syncSession();
    window.addEventListener('hashchange', syncSession);
    return () => window.removeEventListener('hashchange', syncSession);
  }, [isJoined]);

  useEffect(() => {
    if (roomId && roomId.length >= 4) {
      // Local check remains as a fast-path for room discovery
      const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${roomId}`);
      setRoomExists(!!data || playerRole === 'userA');
    } else {
      setRoomExists(null);
    }
  }, [roomId, playerRole]);

  const handleCreatePath = () => {
    const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoom);
    setPlayerRole('userA');
    setView('setup');
  };

  const handleJoinPath = () => {
    setPlayerRole('userB');
    setView('setup');
  };

  const handleLeave = () => {
    localStorage.removeItem(`morningstar_role_${roomId}`);
    window.location.hash = '';
    setIsJoined(false);
    setView('choice');
    setRoomId('');
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName && playerRole && roomId) {
      const finalRoomId = roomId.trim().toUpperCase();
      
      if (playerRole === 'userA') {
        const key = `${STORAGE_KEY_PREFIX}${finalRoomId}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, JSON.stringify({}));
        }
      }

      window.location.hash = finalRoomId;
      localStorage.setItem('morningstar_user_name', userName);
      localStorage.setItem(`morningstar_role_${finalRoomId}`, playerRole);
      setIsJoined(true);
    }
  };

  if (isJoined) {
    return (
      <Dashboard 
        roomId={roomId.trim().toUpperCase()} 
        playerRole={playerRole!} 
        userName={userName} 
        onLeave={handleLeave}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-transparent selection:bg-pink-500/30">
      <div className="mb-12 text-center animate-in fade-in zoom-in duration-1000">
        <div className="relative inline-block group cursor-default">
          <h1 className="text-2xl font-light tracking-[0.1em] text-white uppercase transition-all duration-500 group-hover:tracking-[0.15em] select-none flex items-center justify-center">
            Morning<span className="text-pink-500 font-normal">Star</span>
            <span className="text-pink-400 ml-2 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] animate-star text-xl">✦</span>
          </h1>
          <div className="h-[1px] w-0 group-hover:w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent mx-auto mt-2 transition-all duration-1000"></div>
        </div>
      </div>

      <div className="w-full max-w-sm">
        {view === 'choice' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <button
              onClick={handleCreatePath}
              className="w-full py-6 bg-white text-black font-bold text-[11px] tracking-[0.25em] uppercase rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-white/5"
            >
              Start New Discovery
            </button>
            <div className="flex items-center gap-6 py-4">
              <div className="h-px flex-grow bg-zinc-900"></div>
              <span className="text-[10px] text-zinc-800 uppercase tracking-[0.3em] font-black">OR</span>
              <div className="h-px flex-grow bg-zinc-900"></div>
            </div>
            <button
              onClick={handleJoinPath}
              className="w-full py-6 bg-zinc-900/40 border border-zinc-800/60 text-zinc-500 font-bold text-[11px] tracking-[0.25em] uppercase rounded-2xl transition-all hover:border-zinc-700 hover:text-zinc-300"
            >
              Join Existing Room
            </button>
          </div>
        ) : (
          <form onSubmit={handleFinalSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="space-y-5">
              {playerRole === 'userB' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] ml-1">Access Code</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="E.G. XJ92LK"
                    className={`w-full bg-zinc-900/40 border rounded-2xl p-5 text-white font-mono text-center text-lg focus:outline-none transition-all placeholder:opacity-20 uppercase tracking-widest ${
                      roomId.length >= 4 && roomExists === false 
                        ? 'border-red-900/50 focus:border-red-500/50' 
                        : 'border-zinc-800 focus:border-pink-500/40'
                    }`}
                  />
                  {roomId.length >= 4 && (
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${roomExists !== false ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
                      <p className={`text-[9px] uppercase tracking-widest font-bold ${roomExists !== false ? 'text-zinc-600' : 'text-red-500/80'}`}>
                        {roomExists !== false ? 'Room Search Active' : 'Waiting for Partner 1...'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {playerRole === 'userA' && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-center shadow-inner group">
                  <span className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] block mb-3 font-black group-hover:text-zinc-500 transition-colors">Shared Secret</span>
                  <span className="text-3xl font-mono text-pink-500 tracking-[0.2em] font-bold drop-shadow-[0_0_15px_rgba(236,72,153,0.2)]">{roomId}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] ml-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter identity..."
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-800"
                />
              </div>

              <div className="flex items-center justify-between p-5 bg-zinc-900/20 rounded-2xl border border-zinc-900/50">
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.2em]">Assignment</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                  {playerRole === 'userA' ? 'Protocol Host' : 'Guest Entity'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={!userName || (playerRole === 'userB' && !roomId)}
                className="w-full py-5 bg-white text-black font-bold text-[11px] tracking-[0.25em] uppercase rounded-2xl transition-all disabled:opacity-20 active:scale-[0.98] shadow-xl hover:shadow-white/5"
              >
                {playerRole === 'userA' ? 'Establish Room' : 'Enter Shared Space'}
              </button>
              <button
                type="button"
                onClick={() => setView('choice')}
                className="w-full py-2 text-zinc-800 hover:text-zinc-600 text-[9px] uppercase tracking-[0.4em] transition-colors font-black"
              >
                BACK TO GATEWAY
              </button>
            </div>
          </form>
        )}
      </div>

      <footer className="mt-24 text-center text-zinc-900 text-[8px] uppercase tracking-[0.4em] font-black max-w-[280px] leading-loose opacity-40">
        MorningStar revelation protocol <br/> global cloud sync enabled
      </footer>
    </div>
  );
};

export default App;