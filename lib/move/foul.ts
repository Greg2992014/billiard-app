import type { SnookerState } from '@/lib/gameLogic';
import type { MoveContext, MoveEffect, MoveParams } from './types';

export default function foul(
  ctx: MoveContext,
  params: MoveParams,
): MoveEffect {
  const { gameState, gameType, playerPosition, totalShotsLeft, totalShotsRight } = ctx;
  const foulPts = params.foulPts;

  const isSnooker = gameType === 'snooker';
  const foulPoints = isSnooker
    ? (typeof foulPts === 'number' && foulPts >= 4 && foulPts <= 7 ? foulPts : 4)
    : 0;

  const opponent: 'left' | 'right' = playerPosition === 'left' ? 'right' : 'left';
  let newTotalShotsLeft = totalShotsLeft;
  let newTotalShotsRight = totalShotsRight;

  if (foulPoints > 0) {
    if (opponent === 'left') newTotalShotsLeft += foulPoints;
    else newTotalShotsRight += foulPoints;
  }

  let newGameState = gameState;
  if (isSnooker) {
    const snookerState = newGameState as SnookerState;
    if (snookerState.phase === 'normal') {
      newGameState = { ...snookerState, requiredBallType: 'red' as const };
    }
  }

  return {
    gameState: newGameState,
    pointsEarned: 0,
    foulPoints: foulPoints,
    totalShotsLeft: newTotalShotsLeft,
    totalShotsRight: newTotalShotsRight,
    newCurrentTurn: opponent,
    newStatus: 'active',
    newWinner: null,
    moveMessage: isSnooker
      ? `Фол игрока ${playerPosition}: +${foulPoints} сопернику`
      : `Фол игрока ${playerPosition}`,
    storedBallColor: null,
  };
}
