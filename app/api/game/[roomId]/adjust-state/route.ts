import { NextRequest, NextResponse } from 'next/server';
import { execute, batch } from '@/lib/db';
import { getGame, parseGameState, GameError } from '@/lib/gameService';
import { adjustStateSchema } from '@/lib/validation';
import { handleDbError } from '@/lib/api-helpers';
import type { SnookerState } from '@/lib/gameLogic';
import { COLOR_NAMES_RU } from '@/lib/constants';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const parsed = adjustStateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input: ' + parsed.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const game = await getGame(roomId);
    if (!game) throw new GameError('Game not found', 404);
    if (game.status !== 'active') throw new GameError('Game finished', 400);
    if (game.game_type !== 'snooker') throw new GameError('Only snooker games support state adjustment', 400);

    const snookerState = parseGameState(game.game_state, 'snooker') as SnookerState;
    const { reds: newReds, colors: newColors, totalShotsLeft: newScoreLeft, totalShotsRight: newScoreRight } = parsed.data;

    const oldReds = snookerState.reds;
    const oldColors = { ...snookerState.colors };
    const oldScoreLeft = game.total_shots_left;
    const oldScoreRight = game.total_shots_right;

    const resolvedScoreLeft = newScoreLeft ?? oldScoreLeft;
    const resolvedScoreRight = newScoreRight ?? oldScoreRight;

    let phase: 'normal' | 'colors' = snookerState.phase;
    if (phase === 'normal' && newReds === 0) {
      phase = 'colors';
    }

    // Preserve current requiredBallType; only adjust if phase changed from normal→colors
    // and the player was still on 'red' (impossible state in colors phase)
    let requiredBallType: 'red' | 'color' = snookerState.requiredBallType;
    if (phase === 'colors' && requiredBallType === 'red') {
      requiredBallType = 'color';
    }

    const newSnookerState: SnookerState = {
      type: 'snooker',
      reds: newReds,
      colors: newColors,
      requiredBallType,
      phase,
    };

    const changes: string[] = [];
    if (oldReds !== newReds) {
      changes.push(`красных: ${oldReds} → ${newReds}`);
    }
    for (const c of ['yellow', 'green', 'brown', 'blue', 'pink', 'black'] as const) {
      if (oldColors[c] !== newColors[c]) {
        const name = COLOR_NAMES_RU[c] || c;
        changes.push(newColors[c] === 0 ? `${name} забит` : `${name} на столе`);
      }
    }
    if (newScoreLeft != null && newScoreLeft !== oldScoreLeft) {
      changes.push(`счёт левого: ${oldScoreLeft} → ${newScoreLeft}`);
    }
    if (newScoreRight != null && newScoreRight !== oldScoreRight) {
      changes.push(`счёт правого: ${oldScoreRight} → ${newScoreRight}`);
    }
    const changeDesc = changes.length > 0 ? changes.join(', ') : 'без изменений';

    const moveMessage = `Ручная корректировка: ${changeDesc}`;

    const prevSnapshot = JSON.stringify({
      game_state: game.game_state,
      total_shots_left: game.total_shots_left,
      total_shots_right: game.total_shots_right,
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
                current_turn = ?,
                last_updated_at = ?,
                turn_started_at = ?,
                game_state = ?,
                total_shots_left = ?,
                total_shots_right = ?
              WHERE room_id = ?`,
        args: [
          game.current_turn,
          new Date().toISOString(),
          new Date().toISOString(),
          JSON.stringify(newSnookerState),
          resolvedScoreLeft,
          resolvedScoreRight,
          roomId,
        ],
      },
    ]);

    return NextResponse.json({
      success: true,
      gameState: newSnookerState,
      totalShotsLeft: resolvedScoreLeft,
      totalShotsRight: resolvedScoreRight,
      currentTurn: game.current_turn,
      status: 'active',
      winnerId: null,
      moveMessage,
    });
  } catch (error) {
    if (error instanceof GameError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return handleDbError(error);
  }
}
