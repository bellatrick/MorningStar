
export interface Question {
  id: string;
  text: string;
}

export interface Answer {
  userA: string | null;
  userB: string | null;
}

export type PlayerRole = 'userA' | 'userB';

export interface RoomState {
  roomId: string;
  answers: Record<string, Answer>;
}

export interface SyncMessage {
  type: 'SUBMIT_ANSWER' | 'SYNC_REQUEST' | 'SYNC_RESPONSE' | 'LOBBY_PING' | 'LOBBY_PONG';
  payload: {
    questionId?: string;
    role?: PlayerRole;
    answer?: string;
    fullState?: Record<string, Answer>;
    userName?: string;
  };
}
