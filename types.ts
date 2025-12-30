
export interface Question {
  id: string;
  text: string;
}

export interface AnswerRow {
  room_id: string;
  user_id: string;
  question_id: string;
  answer_text: string;
  created_at?: string;
}

export interface RoomRow {
  id: string;
  host_id: string;
  guest_id: string | null;
  created_at?: string;
}

export type PlayerRole = 'host' | 'guest';

// Added Answer interface to match QuestionCard expectations for local state mapping
export interface Answer {
  userA: string | null;
  userB: string | null;
}

// Added SyncMessage interface for the RealtimeService broadcast events
export interface SyncMessage {
  type: string;
  payload: any;
}

export interface GameState {
  myAnswers: Record<string, string>;
  partnerAnswers: Record<string, string>;
}
