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

// --- Local Simulation Logic (Fallback when Supabase is missing) ---
const LOCAL_ROOMS_KEY = 'morningstar_local_rooms';
const LOCAL_ANSWERS_KEY = 'morningstar_local_answers';

const getLocalRooms = () => JSON.parse(localStorage.getItem(LOCAL_ROOMS_KEY) || '{}');
const saveLocalRooms = (rooms: any) => localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));
const getLocalAnswers = () => JSON.parse(localStorage.getItem(LOCAL_ANSWERS_KEY) || '[]');
const saveLocalAnswers = (answers: any) => localStorage.setItem(LOCAL_ANSWERS_KEY, JSON.stringify(answers));

export const db = {
  isReady: () => true, // Always "ready" now because we have a fallback
  isCloud: () => isConfigured,

  async createRoom(roomId: string, hostId: string) {
    if (supabase) {
      const { data, error } = await supabase
        .from('rooms')
        .insert([{ id: roomId, host_id: hostId }])
        .select();
      return { data, error };
    } else {
      const rooms = getLocalRooms();
      rooms[roomId] = { id: roomId, host_id: hostId, guest_id: null };
      saveLocalRooms(rooms);
      return { data: [rooms[roomId]], error: null };
    }
  },

  async joinRoom(roomId: string, guestId: string) {
    if (supabase) {
      const { data, error } = await supabase
        .from('rooms')
        .update({ guest_id: guestId })
        .eq('id', roomId)
        .is('guest_id', null)
        .select();
      return { data, error };
    } else {
      const rooms = getLocalRooms();
      if (rooms[roomId] && !rooms[roomId].guest_id) {
        rooms[roomId].guest_id = guestId;
        saveLocalRooms(rooms);
        return { data: [rooms[roomId]], error: null };
      }
      return { data: null, error: new Error("Room full or not found") };
    }
  },

  async getRoom(roomId: string) {
    if (supabase) {
      return await supabase.from('rooms').select('*').eq('id', roomId).single();
    } else {
      const rooms = getLocalRooms();
      const room = rooms[roomId];
      return { data: room || null, error: room ? null : new Error("Not found") };
    }
  },

  async submitAnswer(roomId: string, userId: string, qId: string, text: string) {
    if (supabase) {
      return await supabase
        .from('answers')
        .upsert({
          room_id: roomId,
          user_id: userId,
          question_id: qId,
          answer_text: text
        }, { onConflict: 'room_id,user_id,question_id' });
    } else {
      const answers = getLocalAnswers();
      const index = answers.findIndex((a: any) => a.room_id === roomId && a.user_id === userId && a.question_id === qId);
      const newAnswer = { room_id: roomId, user_id: userId, question_id: qId, answer_text: text };
      if (index > -1) answers[index] = newAnswer;
      else answers.push(newAnswer);
      saveLocalAnswers(answers);
      return { error: null };
    }
  },

  async fetchAnswers(roomId: string) {
    if (supabase) {
      return await supabase
        .from('answers')
        .select('*')
        .eq('room_id', roomId);
    } else {
      const answers = getLocalAnswers();
      const filtered = answers.filter((a: any) => a.room_id === roomId);
      return { data: filtered, error: null };
    }
  }
};