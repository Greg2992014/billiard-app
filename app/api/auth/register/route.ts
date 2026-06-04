import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { handleDbError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json({ error: 'Login and password required' }, { status: 400 });
    }

    const existing = await execute({
      sql: 'SELECT id FROM users WHERE login = ?',
      args: [login],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const result = await execute({
      sql: 'INSERT INTO users (login, password) VALUES (?, ?)',
      args: [login, password],
    });

    return NextResponse.json({
      success: true,
      userId: Number(result.lastInsertRowid),
      login,
    });
  } catch (error) {
    return handleDbError(error);
  }
}
