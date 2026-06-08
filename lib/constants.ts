// Shared constants for all game modes
// Single source of truth — used by gameLogic.ts, SnookerControls.tsx, and HistoryLog.tsx

export const COLOR_ORDER = ['yellow', 'green', 'brown', 'blue', 'pink', 'black'] as const;
export type SnookerColor = typeof COLOR_ORDER[number];

export const BALL_DEFS = [
  { name: 'red' as const,    points: 1, ballColor: 'red' },
  { name: 'yellow' as const, points: 2, ballColor: 'yellow' },
  { name: 'green' as const,  points: 3, ballColor: 'green' },
  { name: 'brown' as const,  points: 4, ballColor: 'brown' },
  { name: 'blue' as const,   points: 5, ballColor: 'blue' },
  { name: 'pink' as const,   points: 6, ballColor: 'pink' },
  { name: 'black' as const,  points: 7, ballColor: 'black' },
];

export const COLOR_POINTS: Record<string, number> = Object.fromEntries(
  BALL_DEFS.map(b => [b.name, b.points])
);

export const COLOR_NAMES_RU: Record<string, string> = {
  yellow: 'жёлтый', green: 'зелёный', brown: 'коричневый',
  blue: 'синий', pink: 'розовый', black: 'чёрный', red: 'красный',
};

export const GAME_TYPE_NAMES: Record<string, string> = {
  pool: 'Пул',
  russian: 'Пирамида',
  snooker: 'Снукер',
};

export const POLL_INTERVAL_MS = 3_000;
