export interface HistoryLogMove {
  id: number;
  player_id: number;
  move_type: string;
  ball_color?: string;
  points?: number;
  move_message?: string;
  created_at: string;
  turn_duration_ms?: number;
  cancelled?: number;
}

export interface User {
  id: number;
  login: string;
}

export interface RecentGame {
  room_id: string;
  game_type: string;
  status: string;
  total_shots_left: number;
  total_shots_right: number;
  game_started_at: string;
  current_turn: string;
  left_login: string;
  right_login: string;
  closed?: number;
}
