import type { SnookerState } from '@/lib/gameLogic';
import { COLOR_POINTS, COLOR_NAMES_RU } from '@/lib/constants';
import type { MoveContext, MoveEffect, MoveParams } from './types';

function transitionToColorsIfNeeded(state: SnookerState): SnookerState {
  if (state.phase === 'normal') {
    if (state.reds === 0) {
      return { ...state, phase: 'colors', requiredBallType: 'color' };
    }
    return { ...state, requiredBallType: 'red' };
  }
  return state;
}

function applySnookerFoul(
  snookerState: SnookerState,
  playerPosition: 'left' | 'right',
  totalShotsLeft: number,
  totalShotsRight: number,
  params: MoveParams,
): MoveEffect {
  const opponent: 'left' | 'right' = playerPosition === 'left' ? 'right' : 'left';
  const { ballColor, foulPts } = params;

  let newState = { ...snookerState, colors: { ...snookerState.colors } };
  let penaltyPoints = 0;

  if (ballColor) {
    if (ballColor === 'red') {
      penaltyPoints = 4;
      newState.reds = Math.max(0, newState.reds - 1);
    } else {
      penaltyPoints = Math.max(4, COLOR_POINTS[ballColor] || 0);
      newState.colors[ballColor as keyof typeof newState.colors] = 1;
    }
  } else if (typeof foulPts === 'number' && foulPts >= 4 && foulPts <= 7) {
    penaltyPoints = foulPts;
  } else {
    penaltyPoints = 4;
  }

  newState = transitionToColorsIfNeeded(newState);

  let newTotalShotsLeft = totalShotsLeft;
  let newTotalShotsRight = totalShotsRight;

  if (opponent === 'left') newTotalShotsLeft += penaltyPoints;
  else newTotalShotsRight += penaltyPoints;

  const moveMessage = ballColor
    ? `Фол: забит ${COLOR_NAMES_RU[ballColor] || ballColor} (+${penaltyPoints} сопернику)`
    : `Фол (+${penaltyPoints} сопернику)`;

  return {
    gameState: newState,
    pointsEarned: 0,
    foulPoints: penaltyPoints,
    totalShotsLeft: newTotalShotsLeft,
    totalShotsRight: newTotalShotsRight,
    newCurrentTurn: opponent,
    newStatus: 'active',
    newWinner: null,
    moveMessage,
    storedBallColor: ballColor || null,
  };
}

export default function foul(
  ctx: MoveContext,
  params: MoveParams,
): MoveEffect {
  const { gameState, gameType, playerPosition, totalShotsLeft, totalShotsRight } = ctx;

  if (gameType === 'snooker') {
    return applySnookerFoul(
      gameState as SnookerState,
      playerPosition,
      totalShotsLeft,
      totalShotsRight,
      params,
    );
  }

  const opponent: 'left' | 'right' = playerPosition === 'left' ? 'right' : 'left';

  return {
    gameState,
    pointsEarned: 0,
    foulPoints: 0,
    totalShotsLeft,
    totalShotsRight,
    newCurrentTurn: opponent,
    newStatus: 'active',
    newWinner: null,
    moveMessage: `Фол — ход переходит`,
    storedBallColor: null,
  };
}
