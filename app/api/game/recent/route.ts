import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { handleDbError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const games = await execute({
      sql: `SELECT g.room_id, g.game_type, g.status, g.total_shots_left, g.total_shots_right,
                   g.game_started_at, g.current_turn,
                   u1.login as left_login, u2.login as right_login
            FROM games g
            LEFT JOIN users u1 ON g.player_left_id = u1.id
            LEFT JOIN users u2 ON g.player_right_id = u2.id
            WHERE g.player_left_id = ? OR g.player_right_id = ?
            ORDER BY g.last_updated_at DESC
            LIMIT 10`,
      args: [Number(userId), Number(userId)],
    });

    return NextResponse.json({ games: games.rows });
  } catch (error) {
    return handleDbError(error);
  }
}
