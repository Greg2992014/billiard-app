import { NextRequest, NextResponse } from 'next/server';
import { execute, batch } from '@/lib/db';
import { getGame, parseGameState, GameError } from '@/lib/gameService';
import { adjustPoolStateSchema } from '@/lib/validation';
import { handleDbError } from '@/lib/api-helpers';
import type { PoolState } from '@/lib/gameLogic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const parsed = adjustPoolStateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input: ' + parsed.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const game = await getGame(roomId);
    if (!game) throw new GameError('Game not found', 404);
    if (game.status !== 'active') throw new GameError('Game finished', 400);
    if (game.game_type !== 'pool') throw new GameError('Only pool games support pool state adjustment', 400);

    const poolState = parseGameState(game.game_state, 'pool') as PoolState;
    const { pocketedSolids, pocketedStripes, totalShotsLeft: newScoreLeft, totalShotsRight: newScoreRight } = parsed.data;

    const oldSolids = poolState.pocketedSolids;
    const oldStripes = poolState.pocketedStripes;
    const oldScoreLeft = game.total_shots_left;
    const oldScoreRight = game.total_shots_right;

    if (oldSolids === pocketedSolids && oldStripes === pocketedStripes && oldScoreLeft === newScoreLeft && oldScoreRight === newScoreRight) {
      return NextResponse.json({ success: true, noChange: true });
    }

    const newPoolState: PoolState = {
      ...poolState,
      playerGroup: { ...poolState.playerGroup },
      pocketedSolids,
      pocketedStripes,
    };

    const changes: string[] = [];
    if (oldSolids !== pocketedSolids) changes.push(`сплошных: ${oldSolids} → ${pocketedSolids}`);
    if (oldStripes !== pocketedStripes) changes.push(`полосатых: ${oldStripes} → ${pocketedStripes}`);
    if (oldScoreLeft !== newScoreLeft) changes.push(`счёт левого: ${oldScoreLeft} → ${newScoreLeft}`);
    if (oldScoreRight !== newScoreRight) changes.push(`счёт правого: ${oldScoreRight} → ${newScoreRight}`);

    const moveMessage = `Ручная корректировка: ${changes.join(', ')}`;

    const prevSnapshot = JSON.stringify({
      game_state: game.game_state,
      total_shots_left: oldScoreLeft,
      total_shots_right: oldScoreRight,
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
          'state_adjust',
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
                game_state = ?,
                total_shots_left = ?,
                total_shots_right = ?,
                last_updated_at = ?
              WHERE room_id = ?`,
        args: [JSON.stringify(newPoolState), newScoreLeft, newScoreRight, new Date().toISOString(), roomId],
      },
    ]);

    return NextResponse.json({
      success: true,
      gameState: newPoolState,
      totalShotsLeft: newScoreLeft,
      totalShotsRight: newScoreRight,
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
