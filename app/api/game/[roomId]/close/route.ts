import { NextRequest, NextResponse } from 'next/server';
import { execute, ensureMigrations } from '@/lib/db';
import { getGame, GameError } from '@/lib/gameService';
import { handleDbError } from '@/lib/api-helpers';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await ensureMigrations();
    const { roomId } = await params;
    const game = await getGame(roomId);
    if (!game) throw new GameError('Game not found', 404);
    if (game.closed) return NextResponse.json({ success: true, alreadyClosed: true });

    await execute({
      sql: 'UPDATE games SET closed = 1, last_updated_at = ? WHERE room_id = ?',
      args: [new Date().toISOString(), roomId],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof GameError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return handleDbError(error);
  }
}
