import { NextRequest, NextResponse } from 'next/server';
import { execute, batch } from '@/lib/db';
import { getGame, GameError } from '@/lib/gameService';
import { adjustScoreSchema } from '@/lib/validation';
import { handleDbError } from '@/lib/api-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const parsed = adjustScoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input: ' + parsed.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const game = await getGame(roomId);
    if (!game) throw new GameError('Game not found', 404);
    if (game.status !== 'active') throw new GameError('Game finished', 400);

    const { totalShotsLeft, totalShotsRight } = parsed.data;
    const oldLeft = game.total_shots_left;
    const oldRight = game.total_shots_right;

    const moveMessage = `Ручная корректировка счёта: ${oldLeft}:${oldRight} → ${totalShotsLeft}:${totalShotsRight}`;

    const prevSnapshot = JSON.stringify({
      game_state: game.game_state,
      total_shots_left: oldLeft,
      total_shots_right: oldRight,
      current_turn: game.current_turn,
      status: game.status,
      turn_started_at: game.turn_started_at,
    });

    const turnDurationMs = game.turn_started_at
      ? Date.now() - new Date(game.turn_started_at).getTime()
      : 0;

    await batch([
      {
        sql: `INSERT INTO moves (room_id, move_type, player_id, ball_color, points, turn_duration_ms, move_message, prev_game_snapshot)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          roomId,
          'score_adjust',
          game.current_turn === 'left' ? game.player_left_id : game.player_right_id,
          null,
          0,
          turnDurationMs,
          moveMessage,
          prevSnapshot,
        ],
      },
      {
        sql: `UPDATE games SET
                total_shots_left = ?,
                total_shots_right = ?,
                last_updated_at = ?
              WHERE room_id = ?`,
        args: [totalShotsLeft, totalShotsRight, new Date().toISOString(), roomId],
      },
    ]);

    return NextResponse.json({
      success: true,
      totalShotsLeft,
      totalShotsRight,
      status: 'active',
      moveMessage,
    });
  } catch (error) {
    if (error instanceof GameError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return handleDbError(error);
  }
}
