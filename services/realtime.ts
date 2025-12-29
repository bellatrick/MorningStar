import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { SyncMessage } from '../types';

/**
 * MorningStar Realtime Service
 * Bridges different devices using Supabase Broadcast.
 */

// These are typically injected by Netlify/Vercel at build-time or runtime
const SUPABASE_URL = (process.env as any).SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (process.env as any).SUPABASE_ANON_KEY || '';

// Helper to check if we have actual credentials
const hasValidKeys = SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;

type MessageHandler = (message: SyncMessage) => void;

class RealtimeService {
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private roomId: string | null = null;

  constructor() {
    if (hasValidKeys) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      console.info(
        '%c[MorningStar] Supabase keys not detected.', 
        'color: #ec4899; font-weight: bold;',
        'Running in Local Mode. To enable cross-device play, add SUPABASE_URL and SUPABASE_ANON_KEY to your Netlify environment variables.'
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
          console.log(`[Realtime] Global sync established for room: ${roomId}`);
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

    // Always broadcast locally for same-browser tab syncing (fallback/dev)
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