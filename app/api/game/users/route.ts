import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { handleDbError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const result = await execute({
      sql: 'SELECT id, login FROM users ORDER BY login',
      args: [],
    });
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { login } = await request.json();
    if (!login || !login.trim()) {
      return NextResponse.json({ error: 'Login required' }, { status: 400 });
    }

    const existing = await execute({
      sql: 'SELECT id FROM users WHERE login = ?',
      args: [login.trim()],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Пользователь уже существует' }, { status: 409 });
    }

    const result = await execute({
      sql: 'INSERT INTO users (login, password) VALUES (?, ?)',
      args: [login.trim(), '1234'],
    });

    return NextResponse.json({
      success: true,
      user: { id: Number(result.lastInsertRowid), login: login.trim() },
    });
  } catch (error) {
    return handleDbError(error);
  }
}
