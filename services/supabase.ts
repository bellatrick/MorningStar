import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_URL.startsWith('https://') && 
  SUPABASE_ANON_KEY && 
  SUPABASE_ANON_KEY.length > 10
);

export const supabase = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const db = {
  isReady: () => isConfigured,
  isCloud: () => true,

  async createRoom(roomId: string, hostId: string) {
    if (!supabase) return { data: null, error: new Error("Supabase not configured") };
    
    return await supabase
      .from('rooms')
      .insert([{ id: roomId, host_id: hostId }])
      .select();
  },

  async joinRoom(roomId: string, guestId: string) {
    if (!supabase) return { data: null, error: new Error("Supabase not configured") };

    return await supabase
      .from('rooms')
      .update({ guest_id: guestId })
      .eq('id', roomId)
      .is('guest_id', null)
      .select();
  },

  async getRoom(roomId: string) {
    if (!supabase) return { data: null, error: new Error("Supabase not configured") };
    
    return await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
  },

  async submitAnswer(roomId: string, userId: string, qId: string, text: string) {
    if (!supabase) return { error: new Error("Supabase not configured") };

    return await supabase
      .from('answers')
      .upsert({
        room_id: roomId,
        user_id: userId,
        question_id: qId,
        answer_text: text
      }, { onConflict: 'room_id,user_id,question_id' });
  },

  async fetchAnswers(roomId: string) {
    if (!supabase) return { data: [], error: new Error("Supabase not configured") };

    return await supabase
      .from('answers')
      .select('*')
      .eq('room_id', roomId);
  }
};
