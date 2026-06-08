import type { PoolState } from '@/lib/gameLogic';
import { GameError } from '@/lib/gameService';
import type { MoveContext, MoveEffect, MoveParams } from './types';

export default function durakPool(
  ctx: MoveContext & { gameState: PoolState },
  params: MoveParams,
): MoveEffect {
  const { playerPosition, gameState, totalShotsLeft, totalShotsRight, currentTurn } = ctx;
  const myGroup = gameState.playerGroup[playerPosition];
  const allMyBallsDone = myGroup === 'solid' ? gameState.pocketedSolids >= 7
    : myGroup === 'stripe' ? gameState.pocketedStripes >= 7
    : false;

  if (params.ballColor === 'black') {
    if (!allMyBallsDone) {
      throw new GameError('Нельзя объявить дурака на чёрном — свои шары ещё не забиты', 400);
    }
    return {
      gameState: { ...gameState, playerGroup: { ...gameState.playerGroup }, blackPocketed: true },
      pointsEarned: 0,
      foulPoints: 0,
      totalShotsLeft,
      totalShotsRight,
      newCurrentTurn: currentTurn === 'left' ? 'right' : 'left',
      newStatus: 'finished',
      newWinner: playerPosition,
      moveMessage: 'Дурак — Чёрный забит случайно! Победа!',
      storedBallColor: 'black',
    };
  }

  if (!myGroup) {
    return {
      gameState,
      pointsEarned: 0,
      foulPoints: 0,
      totalShotsLeft,
      totalShotsRight,
      newCurrentTurn: currentTurn,
      newStatus: 'active',
      newWinner: null,
      moveMessage: 'Дурак (группа не назначена)',
      storedBallColor: null,
    };
  }

  if (allMyBallsDone) {
    throw new GameError('Все свои уже забиты — бей чёрный шар', 400);
  }

  const newGameState: PoolState = {
    ...gameState,
    playerGroup: { ...gameState.playerGroup },
  };
  let newTotalShotsLeft = totalShotsLeft;
  let newTotalShotsRight = totalShotsRight;

  if (myGroup === 'solid') newGameState.pocketedSolids++;
  else if (myGroup === 'stripe') newGameState.pocketedStripes++;

  if (playerPosition === 'left') newTotalShotsLeft += 1;
  else newTotalShotsRight += 1;

  return {
    gameState: newGameState,
    pointsEarned: 1,
    foulPoints: 0,
    totalShotsLeft: newTotalShotsLeft,
    totalShotsRight: newTotalShotsRight,
    newCurrentTurn: currentTurn,
    newStatus: 'active',
    newWinner: null,
    moveMessage: 'Дурак! (+1 шар)',
    storedBallColor: null,
  };
}
