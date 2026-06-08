import type { SnookerState } from '@/lib/gameLogic';
import type { MoveContext, MoveEffect, MoveParams } from './types';

export default function turnSwitch(ctx: MoveContext, _params: MoveParams): MoveEffect {
  const { gameState, gameType, totalShotsLeft, totalShotsRight, currentTurn } = ctx;

  const newCurrentTurn: 'left' | 'right' = currentTurn === 'left' ? 'right' : 'left';
  let newGameState = gameState;

  if (gameType === 'snooker') {
    const snookerState = newGameState as SnookerState;
    if (snookerState.phase === 'normal') {
      if (snookerState.reds === 0) {
        newGameState = { ...snookerState, phase: 'colors' as const, requiredBallType: 'color' as const };
      } else {
        newGameState = { ...snookerState, requiredBallType: 'red' as const };
      }
    }
  }

  return {
    gameState: newGameState,
    pointsEarned: 0,
    foulPoints: 0,
    totalShotsLeft,
    totalShotsRight,
    newCurrentTurn,
    newStatus: 'active',
    newWinner: null,
    moveMessage: 'Принудительная смена хода',
    storedBallColor: null,
  };
}
