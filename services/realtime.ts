import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { SyncMessage } from '../types';

/**
 * MorningStar Realtime Service
 * Bridges different devices using Supabase Broadcast.
 */

interface MorningStarConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
}

// Get config from window (injected by Netlify build command)
const getInjectedConfig = (): MorningStarConfig => {
  return (window as any).MORNINGSTAR_CONFIG || {};
};

const config = getInjectedConfig();
const SUPABASE_URL = config.supabaseUrl || '';
const SUPABASE_ANON_KEY = config.supabaseKey || '';

const hasValidKeys = 
  SUPABASE_URL && 
  SUPABASE_URL.startsWith('https://') && 
  SUPABASE_ANON_KEY.length > 20;

type MessageHandler = (message: SyncMessage) => void;

class RealtimeService {
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private roomId: string | null = null;

  constructor() {
    if (hasValidKeys) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('%c[MorningStar] Realtime Engine Armed.', 'color: #22c55e; font-weight: bold;');
    } else {
      console.warn(
        '%c[MorningStar] Keys missing. Local-only mode active.', 
        'color: #f59e0b; font-weight: bold;'
      );
    }
  }

  init(roomId: string) {
    this.roomId = roomId;
    if (!this.supabase) return;

    if (this.channel) this.destroy();
    
    this.channel = this.supabase.channel(`room_${roomId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    this.channel
      .on('broadcast', { event: 'sync' }, (payload) => {
        const message = payload.payload as SyncMessage;
        this.handlers.forEach(handler => handler(message));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`%c[Realtime] Connected to Room: ${roomId}`, 'color: #ec4899;');
        }
      });
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(message: SyncMessage) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'sync',
        payload: message,
      });
    }

    // Always broadcast locally for same-browser tab syncing
    const localEvent = new CustomEvent('morningstar_local_sync', { detail: message });
    window.dispatchEvent(localEvent);
  }

  listenLocal() {
    const handleLocal = (e: any) => {
      this.handlers.forEach(handler => handler(e.detail));
    };
    window.addEventListener('morningstar_local_sync', handleLocal);
    return () => window.removeEventListener('morningstar_local_sync', handleLocal);
  }

  destroy() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.handlers.clear();
  }
}

export const realtime = new RealtimeService();