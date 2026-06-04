import { NextResponse } from 'next/server';
import { isTimeoutError } from '@/lib/db';

export function handleDbError(error: unknown) {
  console.error(error);
  const message = isTimeoutError(error)
    ? 'База данных недоступна (таймаут). Попробуйте ещё раз.'
    : 'Внутренняя ошибка сервера. Попробуйте ещё раз.';
  return NextResponse.json({ error: message }, { status: 500 });
}
