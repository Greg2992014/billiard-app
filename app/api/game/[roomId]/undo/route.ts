import { NextRequest, NextResponse } from 'next/server';
import { execute, batch } from '@/lib/db';
import { GameError } from '@/lib/gameService';
import { handleDbError } from '@/lib/api-helpers';

// POST /api/game/[roomId]/undo — отменить последний ход
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    // Find the last non-cancelled move for this room
    const lastMoveResult = await execute({
      sql: `SELECT * FROM moves
            WHERE room_id = ? AND cancelled = 0
            ORDER BY id DESC LIMIT 1`,
      args: [roomId],
    });

    if (lastMoveResult.rows.length === 0) {
      return NextResponse.json({ error: 'No moves to undo' }, { status: 404 });
    }

    const lastMove = lastMoveResult.rows[0];

    if (!lastMove.prev_game_snapshot) {
      return NextResponse.json({ error: 'Cannot undo: no previous state saved' }, { status: 400 });
    }

    const snapshot = JSON.parse(lastMove.prev_game_snapshot as string);

    // Restore game to its previous state
    await batch([
      {
        sql: `UPDATE games SET
              game_state = ?,
              total_shots_left = ?,
              total_shots_right = ?,
              current_turn = ?,
              status = ?,
              turn_started_at = ?,
              winner_id = NULL,
              game_time_ms = NULL,
              last_updated_at = ?
              WHERE room_id = ?`,
        args: [
          snapshot.game_state,
          snapshot.total_shots_left,
          snapshot.total_shots_right,
          snapshot.current_turn,
          snapshot.status,
          snapshot.turn_started_at,
          new Date().toISOString(),
          roomId,
        ],
      },
      {
        sql: `UPDATE moves SET cancelled = 1 WHERE id = ?`,
        args: [lastMove.id],
      },
    ]);

    // Fetch updated game state
    const gameResult = await execute({
      sql: `SELECT g.*,
            u1.login as left_login, u2.login as right_login
            FROM games g
            LEFT JOIN users u1 ON g.player_left_id = u1.id
            LEFT JOIN users u2 ON g.player_right_id = u2.id
            WHERE g.room_id = ?`,
      args: [roomId],
    });

    const game = gameResult.rows[0];
    const gameState = game.game_state ? JSON.parse(game.game_state as string) : null;

    const movesResult = await execute({
      sql: 'SELECT * FROM moves WHERE room_id = ? ORDER BY created_at ASC LIMIT 50',
      args: [roomId],
    });

    return NextResponse.json({
      success: true,
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
    if (error instanceof GameError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return handleDbError(error);
  }
}
