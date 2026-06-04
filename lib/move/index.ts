import { batch } from '@/lib/db';
import { getGame, parseGameState, GameError, type GameRow } from '@/lib/gameService';
import type { MoveContext, MoveParams, MoveResult, MoveHandler } from './types';

import snookerShot from './snookerShot';
import poolShot from './poolShot';
import russianShot from './russianShot';
import durakSnooker from './durakSnooker';
import durakPool from './durakPool';
import durakRussian from './durakRussian';
import turnSwitch from './turnSwitch';
import foul from './foul';

const dispatch: Record<string, Record<string, MoveHandler>> = {
  snooker: {
    shot: snookerShot as MoveHandler,
    turn_switch: turnSwitch as MoveHandler,
    foul: foul as MoveHandler,
    durak: durakSnooker as MoveHandler,
  },
  pool: {
    shot: poolShot as MoveHandler,
    turn_switch: turnSwitch as MoveHandler,
    foul: foul as MoveHandler,
    durak: durakPool as MoveHandler,
  },
  russian: {
    shot: russianShot as MoveHandler,
    turn_switch: turnSwitch as MoveHandler,
    foul: foul as MoveHandler,
    durak: durakRussian as MoveHandler,
  },
};

function durakDefault(ctx: MoveContext, _params: MoveParams) {
  const { playerPosition, gameState, totalShotsLeft, totalShotsRight, currentTurn } = ctx;
  let newTotalShotsLeft = totalShotsLeft;
  let newTotalShotsRight = totalShotsRight;

  if (playerPosition === 'left') newTotalShotsLeft += 1;
  else newTotalShotsRight += 1;

  return {
    gameState,
    pointsEarned: 1,
    foulPoints: 0,
    totalShotsLeft: newTotalShotsLeft,
    totalShotsRight: newTotalShotsRight,
    newCurrentTurn: currentTurn,
    newStatus: 'active' as const,
    newWinner: null,
    moveMessage: 'Дурак! (+1)',
    storedBallColor: null,
  };
}

export async function processMove(
  roomId: string,
  playerId: number,
  moveType: string,
  shotType?: string,
  ballColor?: string,
  foulPts?: number,
): Promise<MoveResult> {
  const game = await getGame(roomId);
  if (!game) throw new GameError('Game not found', 404);
  if (game.status !== 'active') throw new GameError('Game finished', 400);

  const playerPosition: 'left' | 'right' =
    game.player_left_id === playerId ? 'left' : 'right';

  if ((moveType === 'shot' || moveType === 'durak') && game.current_turn !== playerPosition) {
    throw new GameError('Not your turn', 400);
  }

  const turnDurationMs = game.turn_started_at
    ? Date.now() - new Date(game.turn_started_at).getTime()
    : 0;

  const ctx: MoveContext = {
    gameType: game.game_type,
    playerPosition,
    currentTurn: game.current_turn as 'left' | 'right',
    gameState: parseGameState(game.game_state, game.game_type),
    totalShotsLeft: game.total_shots_left,
    totalShotsRight: game.total_shots_right,
  };

  const params: MoveParams = { shotType, ballColor, foulPts };

  // Capture state BEFORE the move for undo support
  const prevSnapshot = JSON.stringify({
    game_state: game.game_state,
    total_shots_left: game.total_shots_left,
    total_shots_right: game.total_shots_right,
    current_turn: game.current_turn,
    status: game.status,
    turn_started_at: game.turn_started_at,
  });

  const handler = dispatch[game.game_type]?.[moveType] ??
    (moveType === 'durak' ? durakDefault : undefined);

  if (!handler) {
    throw new GameError(`Unsupported move type "${moveType}" for game type "${game.game_type}"`, 400);
  }

  const effect = handler(ctx, params);

  const turnDidSwitch = effect.newCurrentTurn !== game.current_turn;
  const newTurnStartedAt = (!game.turn_started_at || turnDidSwitch)
    ? new Date().toISOString()
    : game.turn_started_at;
  const winnerId = effect.newWinner === 'left'
    ? game.player_left_id
    : effect.newWinner === 'right'
    ? game.player_right_id
    : null;
  const gameTimeMs = effect.newStatus === 'finished'
    ? Date.now() - new Date(game.game_started_at).getTime()
    : null;

  // Points field: for fouls, store the foul penalty value (to opponent);
  // for shots/durak, store points earned by the player, falling back to foulPoints for shot-fouls
  const storedPoints =
    moveType === 'foul' ? (foulPts ?? 0)
    : moveType === 'durak' ? (effect.pointsEarned || effect.foulPoints || 0)
    : moveType === 'shot' ? (effect.pointsEarned || effect.foulPoints || 0)
    : 0;

  await batch([
    {
      sql: `INSERT INTO moves (room_id, move_type, player_id, ball_color, points, turn_duration_ms, move_message, prev_game_snapshot)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        roomId,
        moveType,
        playerId,
        effect.storedBallColor || (moveType === 'durak' && !effect.storedBallColor ? 'durak' : null),
        storedPoints,
        turnDurationMs,
        effect.moveMessage || null,
        prevSnapshot,
      ],
    },
    {
      sql: `UPDATE games SET
              total_shots_left = ?, total_shots_right = ?, current_turn = ?,
              status = ?, winner_id = ?, last_updated_at = ?,
              turn_started_at = ?, game_state = ?
              ${gameTimeMs !== null ? ', game_time_ms = ?' : ''}
            WHERE room_id = ?`,
      args: [
        effect.totalShotsLeft,
        effect.totalShotsRight,
        effect.newCurrentTurn,
        effect.newStatus,
        winnerId,
        new Date().toISOString(),
        newTurnStartedAt,
        JSON.stringify(effect.gameState),
        ...(gameTimeMs !== null ? [gameTimeMs] : []),
        roomId,
      ],
    },
  ]);

  return {
    totalShotsLeft: effect.totalShotsLeft,
    totalShotsRight: effect.totalShotsRight,
    currentTurn: effect.newCurrentTurn,
    status: effect.newStatus,
    winnerId,
    gameState: effect.gameState,
    moveMessage: effect.moveMessage,
    storedBallColor: effect.storedBallColor,
    pointsEarned: effect.pointsEarned,
    turnDurationMs,
  };
}
