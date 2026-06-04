import type { SnookerState } from '@/lib/gameLogic';
import { processSnookerShot } from '@/lib/gameLogic';
import type { MoveContext, MoveEffect, MoveParams } from './types';

export default function snookerShot(
  ctx: MoveContext & { gameState: SnookerState },
  params: MoveParams,
): MoveEffect {
  const { playerPosition, gameState, totalShotsLeft, totalShotsRight, currentTurn } = ctx;
  const ballColor = params.ballColor!;

  const result = processSnookerShot(gameState, ballColor, playerPosition);
  let newTotalShotsLeft = totalShotsLeft;
  let newTotalShotsRight = totalShotsRight;

  if (result.foul) {
    if (playerPosition === 'left') newTotalShotsRight += result.foulPoints;
    else newTotalShotsLeft += result.foulPoints;
  } else {
    if (playerPosition === 'left') newTotalShotsLeft += result.points;
    else newTotalShotsRight += result.points;
  }

  const newCurrentTurn = result.turnSwitch
    ? (currentTurn === 'left' ? 'right' : 'left')
    : currentTurn;

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
    pointsEarned: result.foul ? 0 : result.points,
    foulPoints: result.foul ? result.foulPoints : 0,
    totalShotsLeft: newTotalShotsLeft,
    totalShotsRight: newTotalShotsRight,
    newCurrentTurn,
    newStatus,
    newWinner,
    moveMessage: result.moveMessage,
    storedBallColor: ballColor,
  };
}
