import { NextRequest, NextResponse } from 'next/server';
import { processMove, GameError } from '@/lib/gameService';
import { moveSchema } from '@/lib/validation';
import { handleDbError } from '@/lib/api-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const parsed = moveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input: ' + parsed.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const { playerId, moveType, shotType, ballColor, foulPoints } = parsed.data;

    const result = await processMove(roomId, playerId, moveType, shotType, ballColor, foulPoints);

    return NextResponse.json({
      success: true,
      newState: {
        totalShotsLeft: result.totalShotsLeft,
        totalShotsRight: result.totalShotsRight,
        currentTurn: result.currentTurn,
        status: result.status,
        winnerId: result.winnerId,
        gameState: result.gameState,
        moveMessage: result.moveMessage,
        foul: false,
      },
    });
  } catch (error) {
    if (error instanceof GameError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return handleDbError(error);
  }
}
