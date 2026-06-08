import type { GameRow } from '@/lib/gameService';

export function mapGameRow(row: Record<string, unknown>): GameRow {
  return {
    room_id: String(row.room_id ?? ''),
    game_type: String(row.game_type ?? ''),
    player_left_id: Number(row.player_left_id ?? 0),
    player_right_id: Number(row.player_right_id ?? 0),
    total_shots_left: Number(row.total_shots_left ?? 0),
    total_shots_right: Number(row.total_shots_right ?? 0),
    current_turn: String(row.current_turn ?? ''),
    status: String(row.status ?? ''),
    winner_id: row.winner_id != null ? Number(row.winner_id) : null,
    game_state: row.game_state != null ? String(row.game_state) : null,
    game_started_at: String(row.game_started_at ?? ''),
    last_updated_at: String(row.last_updated_at ?? ''),
    turn_started_at: row.turn_started_at != null ? String(row.turn_started_at) : null,
    game_time_ms: row.game_time_ms != null ? Number(row.game_time_ms) : null,
    closed: Number(row.closed ?? 0),
  };
}
