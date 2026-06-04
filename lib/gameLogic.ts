// lib/gameLogic.ts
import { COLOR_ORDER, COLOR_POINTS } from '@/lib/constants';

export interface SnookerState {
  type: 'snooker';
  reds: number;
  colors: {
    yellow: number;
    green: number;
    brown: number;
    blue: number;
    pink: number;
    black: number;
  };
  requiredBallType: 'red' | 'color';
  phase: 'normal' | 'colors';
}

export interface PoolState {
  type: 'pool';
  playerGroup: { left: 'solid' | 'stripe' | null; right: 'solid' | 'stripe' | null };
  pocketedSolids: number;
  pocketedStripes: number;
  blackPocketed: boolean;
}

export interface RussianState {
  type: 'russian';
  ballsLeft: number;
  ballsRight: number;
  target: number;
}

export type GameState = SnookerState | PoolState | RussianState;

export const initialSnookerState: SnookerState = {
  type: 'snooker',
  reds: 15,
  colors: { yellow: 1, green: 1, brown: 1, blue: 1, pink: 1, black: 1 },
  requiredBallType: 'red',
  phase: 'normal',
};

export function processSnookerShot(
  state: SnookerState,
  ballColor: string,
  currentPlayer: 'left' | 'right'
): {
  newState: SnookerState;
  points: number;
  turnSwitch: boolean;
  gameOver: boolean;
  foul: boolean;
  foulPoints: number;
  moveMessage: string;
} {
  const newState: SnookerState = {
    ...state,
    colors: { ...state.colors },
  };
  let points = 0;
  let turnSwitch = false;
  let gameOver = false;
  let foul = false;
  let moveMessage = '';

  if (newState.phase === 'normal') {
    if (newState.requiredBallType === 'red' && ballColor !== 'red') foul = true;
    else if (newState.requiredBallType === 'color' && ballColor === 'red') foul = true;
  } else {
    const nextColor = getNextColorInOrder(newState);
    if (ballColor !== nextColor) foul = true;
  }

  if (foul) {
    return {
      newState: state, points: 0, turnSwitch: true, gameOver: false,
      foul: true, foulPoints: foulValueForState(state, ballColor),
      moveMessage: 'фол',
    };
  }

  if (ballColor === 'red') {
    if (newState.reds <= 0) {
      return {
        newState: state, points: 0, turnSwitch: true, gameOver: false,
        foul: true, foulPoints: foulValueForState(state, ballColor),
        moveMessage: 'фол (нет красных)',
      };
    }
    newState.reds--;
    points = 1;
    newState.requiredBallType = 'color';
    turnSwitch = false;
    moveMessage = `Забит красный (+1)`;
  } else {
    const colorKey = ballColor as keyof typeof newState.colors;
    points = COLOR_POINTS[ballColor] || 0;

    if (newState.phase === 'normal') {
      newState.colors[colorKey] = 1;
      if (newState.reds === 0) {
        newState.phase = 'colors';
        newState.requiredBallType = 'color';
      } else {
        newState.requiredBallType = 'red';
      }
      turnSwitch = false;
      moveMessage = `Забит ${ballColor} (+${points})`;
    } else {
      newState.colors[colorKey] = 0;
      turnSwitch = false;
      moveMessage = `Забит ${ballColor} (+${points})`;
      const allColorsGone = COLOR_ORDER.every(c => newState.colors[c] === 0);
      if (allColorsGone) {
        gameOver = true;
      } else {
        newState.requiredBallType = 'color';
      }
    }
  }

  return { newState, points, turnSwitch, gameOver, foul: false, foulPoints: 0, moveMessage };
}

function foulValueForState(state: SnookerState, ballColor: string): number {
  const foulValue = (color: string) => Math.max(4, COLOR_POINTS[color] || 0);

  const ballOnValue = state.phase === 'colors'
    ? COLOR_ORDER.reduce((v, c) => state.colors[c] === 1 ? foulValue(c) : v, 4)
    : 4;

  return Math.max(4, ballOnValue, foulValue(ballColor));
}

function getNextColorInOrder(state: SnookerState): string | null {
  for (const color of COLOR_ORDER) {
    if (state.colors[color] === 1) {
      return color;
    }
  }
  return null;
}

// ========================
// POOL (8-ball)
// ========================

export const initialPoolState: PoolState = {
  type: 'pool',
  playerGroup: { left: null, right: null },
  pocketedSolids: 0,
  pocketedStripes: 0,
  blackPocketed: false,
};

const BALLS_PER_GROUP = 7;

export function processPoolShot(
  player: 'left' | 'right',
  shotType: 'solid' | 'stripe' | 'black',
  state: PoolState
): {
  newState: PoolState;
  points: number;
  turnSwitch: boolean;
  foul: boolean;
  winner: 'left' | 'right' | null;
  message: string;
} {
  let newState: PoolState = {
    ...state,
    playerGroup: { ...state.playerGroup },
  };
  let points = 0;
  let turnSwitch = false;
  let foul = false;
  let winner: 'left' | 'right' | null = null;
  let message = '';

  const opponent = player === 'left' ? 'right' : 'left';

  if (shotType !== 'black' && newState.playerGroup[player] === null) {
    newState.playerGroup[player] = shotType;
    newState.playerGroup[opponent] = shotType === 'solid' ? 'stripe' : 'solid';
    message = `${player === 'left' ? 'Левый' : 'Правый'} играет ${shotType === 'solid' ? 'сплошные' : 'полосатые'}`;
  }

  const myGroup = newState.playerGroup[player];

  if (shotType === 'black') {
    const myPocketed = myGroup === 'solid' ? newState.pocketedSolids : newState.pocketedStripes;

    if (myGroup !== null && myPocketed >= BALLS_PER_GROUP) {
      winner = player;
      newState.blackPocketed = true;
      message = `Победа!`;
    } else {
      winner = opponent;
      newState.blackPocketed = true;
      foul = true;
      message = `Чёрный забит досрочно — поражение!`;
    }
    turnSwitch = true;

  } else if (myGroup === null || shotType === myGroup) {
    if (shotType === 'solid') newState.pocketedSolids++;
    else newState.pocketedStripes++;
    points = 1;
    turnSwitch = false;
    message = `Забит ${shotType === 'solid' ? 'сплошной' : 'полосатый'}`;

  } else {
    // Defensive fallback — normally intercepted by poolShot.ts before reaching here
    foul = true;
    turnSwitch = true;
    message = `Фол: забит чужой шар`;
  }

  return { newState, points, turnSwitch, foul, winner, message };
}

// ========================
// RUSSIAN BILLIARD
// ========================

export const initialRussianState: RussianState = {
  type: 'russian',
  ballsLeft: 0,
  ballsRight: 0,
  target: 8,
};

export function processRussianShot(
  player: 'left' | 'right',
  state: RussianState
): {
  newState: RussianState;
  points: number;
  turnSwitch: boolean;
  winner: 'left' | 'right' | null;
  message: string;
} {
  const newState: RussianState = { ...state };
  let winner: 'left' | 'right' | null = null;

  if (player === 'left') newState.ballsLeft++;
  else newState.ballsRight++;

  if (newState.ballsLeft >= newState.target) winner = 'left';
  else if (newState.ballsRight >= newState.target) winner = 'right';

  return {
    newState,
    points: 1,
    turnSwitch: false,
    winner,
    message: `Забит шар (+1)`,
  };
}
