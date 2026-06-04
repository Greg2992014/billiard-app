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
  foulPoints: z.number().min(4).max(7).optional(),
});

export const createUserSchema = z.object({
  login: z.string().min(1).max(50).trim(),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type MoveInput = z.infer<typeof moveSchema>;
