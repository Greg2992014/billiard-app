import type { RussianState } from '@/lib/gameLogic';
import { GameError } from '@/lib/gameService';
import type { MoveContext, MoveEffect, MoveParams } from './types';

export default function durakRussian(
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

  const newGameState: RussianState = { ...gameState };
  let newTotalShotsLeft = totalShotsLeft;
  let newTotalShotsRight = totalShotsRight;

  if (playerPosition === 'left') {
    newGameState.ballsLeft++;
    newTotalShotsLeft += 1;
  } else {
    newGameState.ballsRight++;
    newTotalShotsRight += 1;
  }

  let newStatus: 'active' | 'finished' = 'active';
  let newWinner: 'left' | 'right' | null = null;

  if (newGameState.ballsLeft >= newGameState.target) {
    newStatus = 'finished';
    newWinner = 'left';
  } else if (newGameState.ballsRight >= newGameState.target) {
    newStatus = 'finished';
    newWinner = 'right';
  }

  return {
    gameState: newGameState,
    pointsEarned: 1,
    foulPoints: 0,
    totalShotsLeft: newTotalShotsLeft,
    totalShotsRight: newTotalShotsRight,
    newCurrentTurn: currentTurn,
    newStatus,
    newWinner,
    moveMessage: 'Дурак! (+1 шар)',
    storedBallColor: null,
  };
}
