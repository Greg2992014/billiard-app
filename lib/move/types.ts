import type { GameState } from '@/lib/gameLogic';

export interface MoveContext {
  gameType: string;
  playerPosition: 'left' | 'right';
  currentTurn: 'left' | 'right';
  gameState: GameState;
  totalShotsLeft: number;
  totalShotsRight: number;
}

export interface MoveParams {
  shotType?: string;
  ballColor?: string;
  foulPts?: number;
}

export interface MoveEffect {
  gameState: GameState;
  pointsEarned: number;
  /** Foul penalty points given to the opponent. 0 when no foul occurred. Used to record foul points in the moves table for shot-fouls and durak-fouls. */
  foulPoints: number;
  totalShotsLeft: number;
  totalShotsRight: number;
  newCurrentTurn: 'left' | 'right';
  newStatus: 'active' | 'finished';
  newWinner: 'left' | 'right' | null;
  moveMessage: string;
  storedBallColor: string | null;
}

export type MoveHandler = (ctx: MoveContext, params: MoveParams) => MoveEffect;

export interface MoveResult {
  totalShotsLeft: number;
  totalShotsRight: number;
  currentTurn: string;
  status: string;
  winnerId: number | null;
  gameState: GameState;
  moveMessage: string;
  storedBallColor: string | null;
  pointsEarned: number;
  turnDurationMs: number;
}
