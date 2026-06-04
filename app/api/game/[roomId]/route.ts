import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { handleDbError } from '@/lib/api-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const gameResult = await execute({
      sql: `SELECT g.*,
            u1.login as left_login, u2.login as right_login
            FROM games g
            LEFT JOIN users u1 ON g.player_left_id = u1.id
            LEFT JOIN users u2 ON g.player_right_id = u2.id
            WHERE g.room_id = ?`,
      args: [roomId],
    });
    if (gameResult.rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    const game = gameResult.rows[0];

    const movesResult = await execute({
      sql: 'SELECT * FROM moves WHERE room_id = ? ORDER BY created_at ASC LIMIT 50',
      args: [roomId],
    });

    const gameState = game.game_state ? JSON.parse(game.game_state as string) : null;

    return NextResponse.json({
      roomId: game.room_id,
      gameType: game.game_type,
      status: game.status,
      currentTurn: game.current_turn,
      winnerId: game.winner_id,
      players: {
        left: { id: game.player_left_id, login: game.left_login, score: game.total_shots_left },
        right: { id: game.player_right_id, login: game.right_login, score: game.total_shots_right },
      },
      gameState,
      turn_started_at: game.turn_started_at,
      game_started_at: game.game_started_at,
      moves: movesResult.rows,
    });
  } catch (error) {
    return handleDbError(error);
  }
}
