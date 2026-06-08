import { execute } from '@/lib/db';
import {
  initialSnookerState,
  initialPoolState,
  initialRussianState,
} from '@/lib/gameLogic';
import type { GameState, SnookerState, PoolState, RussianState } from '@/lib/gameLogic';
import { mapGameRow } from '@/lib/mappers';

export { processMove } from '@/lib/move';

export interface GameRow {
  room_id: string;
  game_type: string;
  player_left_id: number;
  player_right_id: number;
  total_shots_left: number;
  total_shots_right: number;
  current_turn: string;
  status: string;
  winner_id: number | null;
  game_state: string | null;
  game_started_at: string;
  last_updated_at: string;
  turn_started_at: string | null;
  game_time_ms: number | null;
  closed: number;
}

export async function getGame(roomId: string) {
  const result = await execute({
    sql: 'SELECT * FROM games WHERE room_id = ?',
    args: [roomId],
  });
  return result.rows[0] ? mapGameRow(result.rows[0] as unknown as Record<string, unknown>) : null;
}

export function parseGameState(raw: string | null, gameType: string): GameState {
  if (raw) {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (gameType === 'snooker' && parsed.nextRequired !== undefined) {
      parsed.requiredBallType = parsed.nextRequired;
      delete parsed.nextRequired;
    }
    if (!parsed.type) parsed.type = gameType;

    switch (parsed.type) {
      case 'snooker': return parsed as unknown as SnookerState;
      case 'pool': return parsed as unknown as PoolState;
      case 'russian': return parsed as unknown as RussianState;
      default: throw new Error(`Unknown game state type: ${String(parsed.type)}`);
    }
  }
  switch (gameType) {
    case 'snooker': return initialSnookerState;
    case 'pool': return initialPoolState;
    case 'russian': return initialRussianState;
    default: throw new Error('Unknown game type');
  }
}

export async function createGame(gameType: string, leftLogin: string, rightLogin: string) {
  // Upsert left user
  let leftId: number;
  const leftExisting = await execute({ sql: 'SELECT id FROM users WHERE login = ?', args: [leftLogin] });
  if (leftExisting.rows.length === 0) {
    const r = await execute({ sql: 'INSERT INTO users (login, password) VALUES (?, ?)', args: [leftLogin, ''] });
    leftId = Number(r.lastInsertRowid);
  } else {
    leftId = Number(leftExisting.rows[0].id);
  }

  // Upsert right user
  let rightId: number;
  const rightExisting = await execute({ sql: 'SELECT id FROM users WHERE login = ?', args: [rightLogin] });
  if (rightExisting.rows.length === 0) {
    const r = await execute({ sql: 'INSERT INTO users (login, password) VALUES (?, ?)', args: [rightLogin, ''] });
    rightId = Number(r.lastInsertRowid);
  } else {
    rightId = Number(rightExisting.rows[0].id);
  }

  return { leftId, rightId };
}

export class GameError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
