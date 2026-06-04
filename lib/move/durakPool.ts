import type { PoolState } from '@/lib/gameLogic';
import { GameError } from '@/lib/gameService';
import type { MoveContext, MoveEffect, MoveParams } from './types';

export default function durakPool(
  ctx: MoveContext & { gameState: PoolState },
  _params: MoveParams,
): MoveEffect {
  const { playerPosition, gameState, totalShotsLeft, totalShotsRight, currentTurn } = ctx;
  const myGroup = gameState.playerGroup[playerPosition];

  // If all 7 balls of the group are already pocketed, durak is blocked — only black ball remains
  if (myGroup === 'solid' && gameState.pocketedSolids >= 7) {
    throw new GameError('Все сплошные уже забиты — бей чёрный шар', 400);
  }
  if (myGroup === 'stripe' && gameState.pocketedStripes >= 7) {
    throw new GameError('Все полосатые уже забиты — бей чёрный шар', 400);
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
    gameState: myGroup ? newGameState : gameState,
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
