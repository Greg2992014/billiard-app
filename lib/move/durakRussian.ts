import type { RussianState } from '@/lib/gameLogic';
import { applyRussianPocket } from '@/lib/gameLogic';
import { GameError } from '@/lib/gameService';
import type { MoveContext, MoveEffect, MoveParams } from './types';

export default function durakRussian(
  ctx: MoveContext & { gameState: RussianState },
  _params: MoveParams,
): MoveEffect {
  const { playerPosition, gameState, totalShotsLeft, totalShotsRight, currentTurn } = ctx;

  if (playerPosition === 'left' && gameState.ballsLeft >= gameState.target) {
    throw new GameError(`Левый игрок уже забил ${gameState.target} шаров`, 400);
  }
  if (playerPosition === 'right' && gameState.ballsRight >= gameState.target) {
    throw new GameError(`Правый игрок уже забил ${gameState.target} шаров`, 400);
  }

  const result = applyRussianPocket(playerPosition, gameState);
  let newTotalShotsLeft = totalShotsLeft;
  let newTotalShotsRight = totalShotsRight;

  if (playerPosition === 'left') newTotalShotsLeft += 1;
  else newTotalShotsRight += 1;

  return {
    gameState: result.newState,
    pointsEarned: 1,
    foulPoints: 0,
    totalShotsLeft: newTotalShotsLeft,
    totalShotsRight: newTotalShotsRight,
    newCurrentTurn: currentTurn,
    newStatus: result.winner ? 'finished' : 'active',
    newWinner: result.winner,
    moveMessage: 'Дурак! (+1 шар)',
    storedBallColor: null,
  };
}
