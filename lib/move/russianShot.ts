import type { RussianState } from '@/lib/gameLogic';
import { processRussianShot } from '@/lib/gameLogic';
import { GameError } from '@/lib/gameService';
import type { MoveContext, MoveEffect, MoveParams } from './types';

export default function russianShot(
  ctx: MoveContext & { gameState: RussianState },
  _params: MoveParams,
): MoveEffect {
  const { playerPosition, gameState, totalShotsLeft, totalShotsRight, currentTurn } = ctx;

  // Block if player already reached target
  if (playerPosition === 'left' && gameState.ballsLeft >= gameState.target) {
    throw new GameError(`Левый игрок уже забил ${gameState.target} шаров`, 400);
  }
  if (playerPosition === 'right' && gameState.ballsRight >= gameState.target) {
    throw new GameError(`Правый игрок уже забил ${gameState.target} шаров`, 400);
  }

  const result = processRussianShot(playerPosition, gameState);
  let newTotalShotsLeft = totalShotsLeft;
  let newTotalShotsRight = totalShotsRight;

  if (playerPosition === 'left') newTotalShotsLeft += result.points;
  else newTotalShotsRight += result.points;

  return {
    gameState: result.newState,
    pointsEarned: result.points,
    foulPoints: 0,
    totalShotsLeft: newTotalShotsLeft,
    totalShotsRight: newTotalShotsRight,
    newCurrentTurn: result.turnSwitch
      ? (currentTurn === 'left' ? 'right' : 'left')
      : currentTurn,
    newStatus: result.winner ? 'finished' : 'active',
    newWinner: result.winner,
    moveMessage: result.message,
    storedBallColor: null,
  };
}
