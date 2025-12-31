import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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

  async createRoom(roomId: string, hostId: string, hostName: string) {
    if (!supabase) return { data: null, error: new Error("Supabase not configured") };

    return await supabase
      .from('myrooms')
      .insert([{ id: roomId, host_id: hostId, host_name: hostName }])
      .select();
  },

  async joinRoom(roomId: string, guestId: string, guestName: string) {
    if (!supabase) return { data: null, error: new Error("Supabase not configured") };

    return await supabase
      .from('myrooms')
      .update({ guest_id: guestId, guest_name: guestName })
      .eq('id', roomId)
      .is('guest_id', null)
      .select();
  },

  async getRoom(roomId: string) {
    if (!supabase) return { data: null, error: new Error("Supabase not configured") };

    return await supabase
      .from('myrooms')
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
  },

  // Admin methods
  async getAllRooms() {
    if (!supabase) return { data: [], error: new Error("Supabase not configured") };

    return await supabase
      .from('myrooms')
      .select('*')
      .order('created_at', { ascending: false });
  },

  async deleteRoom(roomId: string) {
    if (!supabase) return { error: new Error("Supabase not configured") };

    // Delete answers first (foreign key constraint)
    await supabase
      .from('answers')
      .delete()
      .eq('room_id', roomId);

    // Then delete the room
    return await supabase
      .from('myrooms')
      .delete()
      .eq('id', roomId);
  },

  // Question methods
  async getAllQuestions() {
    if (!supabase) return { data: [], error: new Error("Supabase not configured") };

    return await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: true });
  },

  async submitQuestion(text: string, userId: string) {
    if (!supabase) return { error: new Error("Supabase not configured") };

    const id = `custom_${Math.random().toString(36).substring(2, 15)}`;

    return await supabase
      .from('questions')
      .insert([{ id, text, submitted_by: userId }])
      .select();
  },

  async deleteQuestion(id: string) {
    if (!supabase) return { error: new Error("Supabase not configured") };

    return await supabase
      .from('questions')
      .delete()
      .eq('id', id);
  },

  async getUserRooms(userId: string) {
    if (!supabase) return { data: [], error: new Error("Supabase not configured") };

    return await supabase
      .from('myrooms')
      .select('*')
      .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
      .order('created_at', { ascending: false });
  }
};