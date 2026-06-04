import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function GET() {
  try {
    await execute({ sql: 'SELECT 1' });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[health] db ping failed:', error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
