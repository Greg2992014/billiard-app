import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { handleDbError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json({ error: 'Login and password required' }, { status: 400 });
    }

    const result = await execute({
      sql: 'SELECT id, login FROM users WHERE login = ? AND password = ?',
      args: [login, password],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];
    return NextResponse.json({
      success: true,
      userId: user.id,
      login: user.login,
    });
  } catch (error) {
    return handleDbError(error);
  }
}
