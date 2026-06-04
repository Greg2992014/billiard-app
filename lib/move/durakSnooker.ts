import type { SnookerState } from '@/lib/gameLogic';
import { processSnookerShot } from '@/lib/gameLogic';
import type { MoveContext, MoveEffect, MoveParams } from './types';

export default function durakSnooker(
  ctx: MoveContext & { gameState: SnookerState },
  params: MoveParams,
): MoveEffect {
  const { playerPosition, gameState, totalShotsLeft, totalShotsRight, currentTurn } = ctx;
  const ballColor = params.ballColor!;

  const result = processSnookerShot(gameState, ballColor, playerPosition);

  if (result.foul) {
    let newTotalShotsLeft = totalShotsLeft;
    let newTotalShotsRight = totalShotsRight;
    if (playerPosition === 'left') newTotalShotsRight += result.foulPoints;
    else newTotalShotsLeft += result.foulPoints;

    return {
      gameState: result.newState,
      pointsEarned: 0,
      foulPoints: result.foulPoints,
      totalShotsLeft: newTotalShotsLeft,
      totalShotsRight: newTotalShotsRight,
      newCurrentTurn: currentTurn === 'left' ? 'right' : 'left',
      newStatus: 'active',
      newWinner: null,
      moveMessage: 'Дурак — Фол! Смена хода',
      storedBallColor: ballColor,
    };
  }

  let newTotalShotsLeft = totalShotsLeft;
  let newTotalShotsRight = totalShotsRight;
  if (playerPosition === 'left') newTotalShotsLeft += result.points;
  else newTotalShotsRight += result.points;

  let newStatus: 'active' | 'finished' = 'active';
  let newWinner: 'left' | 'right' | null = null;

  if (result.gameOver) {
    newStatus = 'finished';
    newWinner = newTotalShotsLeft > newTotalShotsRight
      ? 'left'
      : newTotalShotsRight > newTotalShotsLeft ? 'right' : null;
  }

  return {
    gameState: result.newState,
    pointsEarned: result.points,
    foulPoints: 0,
    totalShotsLeft: newTotalShotsLeft,
    totalShotsRight: newTotalShotsRight,
    newCurrentTurn: currentTurn,
    newStatus,
    newWinner,
    moveMessage: `Дурак! Забит ${ballColor} (+${result.points})`,
    storedBallColor: ballColor,
  };
}
