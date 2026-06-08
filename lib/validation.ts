import { z } from 'zod';

export const createGameSchema = z.object({
  gameType: z.enum(['pool', 'russian', 'snooker']),
  playerLeftLogin: z.string().min(1).max(50),
  playerRightLogin: z.string().min(1).max(50),
});

export const moveSchema = z.object({
  playerId: z.number(),
  moveType: z.enum(['shot', 'turn_switch', 'foul', 'durak']),
  shotType: z.enum(['solid', 'stripe', 'black']).optional(),
  ballColor: z.string().optional(),
  foulPoints: z.number().min(0).max(7).optional(),
});

export const adjustStateSchema = z.object({
  playerId: z.number(),
  reds: z.number().int().min(0).max(15),
  colors: z.object({
    yellow: z.number().min(0).max(1),
    green: z.number().min(0).max(1),
    brown: z.number().min(0).max(1),
    blue: z.number().min(0).max(1),
    pink: z.number().min(0).max(1),
    black: z.number().min(0).max(1),
  }),
  totalShotsLeft: z.number().int().min(0).optional(),
  totalShotsRight: z.number().int().min(0).optional(),
});

export const adjustScoreSchema = z.object({
  playerId: z.number(),
  totalShotsLeft: z.number().int().min(0),
  totalShotsRight: z.number().int().min(0),
});

export const adjustPoolStateSchema = z.object({
  playerId: z.number(),
  pocketedSolids: z.number().int().min(0).max(7),
  pocketedStripes: z.number().int().min(0).max(7),
  totalShotsLeft: z.number().int().min(0),
  totalShotsRight: z.number().int().min(0),
});

export const adjustRussianStateSchema = z.object({
  playerId: z.number(),
  ballsLeft: z.number().int().min(0),
  ballsRight: z.number().int().min(0),
  target: z.number().int().min(1),
  totalShotsLeft: z.number().int().min(0),
  totalShotsRight: z.number().int().min(0),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type MoveInput = z.infer<typeof moveSchema>;
