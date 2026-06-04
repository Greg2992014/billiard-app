import type { PoolState } from '@/lib/gameLogic';
import { processPoolShot } from '@/lib/gameLogic';
import { GameError } from '@/lib/gameService';
import type { MoveContext, MoveEffect, MoveParams } from './types';

export default function poolShot(
  ctx: MoveContext & { gameState: PoolState },
  params: MoveParams,
): MoveEffect {
  const { playerPosition, gameState, totalShotsLeft, totalShotsRight, currentTurn } = ctx;
  const shotType = params.shotType!;

  const opp: 'left' | 'right' = playerPosition === 'left' ? 'right' : 'left';
  const myGroup = gameState.playerGroup[playerPosition];
  const oppGroup = gameState.playerGroup[opp];

  if (
    myGroup !== null &&
    shotType !== myGroup &&
    shotType !== 'black' &&
    !(oppGroup !== null && shotType === oppGroup)
  ) {
    throw new GameError('Invalid shot type for your assigned group', 400);
  }

  // Block shooting own balls if all 7 are already pocketed
  if (myGroup === 'solid' && shotType === 'solid' && gameState.pocketedSolids >= 7) {
    throw new GameError('Все сплошные уже забиты — бей чёрный шар', 400);
  }
  if (myGroup === 'stripe' && shotType === 'stripe' && gameState.pocketedStripes >= 7) {
    throw new GameError('Все полосатые уже забиты — бей чёрный шар', 400);
  }

  const isOpponentBall = myGroup !== null && oppGroup !== null && shotType === oppGroup;

  if (isOpponentBall) {
    // Block opponent ball foul if opponent's group is already full
    if (oppGroup === 'solid' && gameState.pocketedSolids >= 7) {
      throw new GameError('У соперника уже забиты все сплошные', 400);
    }
    if (oppGroup === 'stripe' && gameState.pocketedStripes >= 7) {
      throw new GameError('У соперника уже забиты все полосатые', 400);
    }

    const newGameState: PoolState = {
      ...gameState,
      playerGroup: { ...gameState.playerGroup },
    };
    if (oppGroup === 'solid') newGameState.pocketedSolids++;
    else newGameState.pocketedStripes++;

    let newTotalShotsLeft = totalShotsLeft;
    let newTotalShotsRight = totalShotsRight;
    if (opp === 'left') newTotalShotsLeft += 1;
    else newTotalShotsRight += 1;

    return {
      gameState: newGameState,
      pointsEarned: 0,
      foulPoints: 1,
      totalShotsLeft: newTotalShotsLeft,
      totalShotsRight: newTotalShotsRight,
      newCurrentTurn: currentTurn === 'left' ? 'right' : 'left',
      newStatus: 'active',
      newWinner: null,
      moveMessage: 'Забит чужой шар — фол! +1 шару соперника',
      storedBallColor: oppGroup,
    };
  }

  const result = processPoolShot(playerPosition, shotType as 'solid' | 'stripe' | 'black', gameState);
  let newTotalShotsLeft = totalShotsLeft;
  let newTotalShotsRight = totalShotsRight;

  if (!result.foul && result.points > 0) {
    if (playerPosition === 'left') newTotalShotsLeft += result.points;
    else newTotalShotsRight += result.points;
  }

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
    storedBallColor: shotType,
  };
}
