import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { nanoid } from 'nanoid';
import { initialSnookerState, initialPoolState, initialRussianState } from '@/lib/gameLogic';
import { createGameSchema } from '@/lib/validation';
import { createGame } from '@/lib/gameService';
import { handleDbError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createGameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { gameType, playerLeftLogin, playerRightLogin } = parsed.data;

    const { leftId, rightId } = await createGame(gameType, playerLeftLogin, playerRightLogin);

    const roomId = nanoid(8);
    const now = new Date().toISOString();

    let gameState: string;
    switch (gameType) {
      case 'snooker': gameState = JSON.stringify(initialSnookerState); break;
      case 'pool': gameState = JSON.stringify(initialPoolState); break;
      case 'russian': gameState = JSON.stringify(initialRussianState); break;
      default: return NextResponse.json({ error: 'Unknown game type' }, { status: 400 });
    }

    await execute({
      sql: `INSERT INTO games (room_id, game_type, player_left_id, player_right_id, current_turn, game_state, game_started_at, total_shots_left, total_shots_right, status)
            VALUES (?, ?, ?, ?, 'left', ?, ?, 0, 0, 'active')`,
      args: [roomId, gameType, leftId, rightId, gameState, now],
    });

    return NextResponse.json({ roomId });
  } catch (error) {
    return handleDbError(error);
  }
}
