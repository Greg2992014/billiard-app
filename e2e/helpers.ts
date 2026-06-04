import { APIRequestContext } from '@playwright/test';

const BASE = 'http://localhost:3000';

let counter = 0;

export function uniqueName(prefix: string) {
  counter++;
  return `${prefix}_${Date.now()}_${counter}`;
}

async function retry<T>(fn: () => Promise<T>, label: string, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('таймаут') || msg.includes('timed out') || msg.includes('fetch failed')) {
        console.warn(`[retry] ${label} attempt ${attempt + 1}/${maxAttempts}: ${msg}`);
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

export async function registerUser(request: APIRequestContext, login: string, password = 'test') {
  return retry(async () => {
    const res = await request.post(`${BASE}/api/auth/register`, {
      data: { login, password },
    });
    const data = await res.json();
    if (res.status() === 409) {
      const loginRes = await request.post(`${BASE}/api/auth/login`, {
        data: { login, password },
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok()) throw new Error(`Login failed: ${loginData.error}`);
      return { userId: loginData.userId as number, login: loginData.login as string };
    }
    if (!res.ok()) throw new Error(`Register failed: ${data.error || res.status()}`);
    return { userId: data.userId as number, login: data.login as string };
  }, `register ${login}`);
}

export async function createGame(
  request: APIRequestContext,
  gameType: 'pool' | 'russian' | 'snooker',
  leftLogin: string,
  rightLogin: string,
) {
  return retry(async () => {
    const res = await request.post(`${BASE}/api/game/create`, {
      data: { gameType, playerLeftLogin: leftLogin, playerRightLogin: rightLogin },
    });
    const data = await res.json();
    if (!res.ok()) throw new Error(`Failed to create game: ${data.error}`);
    return data.roomId as string;
  }, `createGame ${gameType}`);
}

export async function postMove(
  request: APIRequestContext,
  roomId: string,
  body: Record<string, unknown>,
) {
  return retry(async () => {
    const res = await request.post(`${BASE}/api/game/${roomId}/move`, { data: body });
    const data = await res.json();
    if (res.status() === 500 && (data.error || '').includes('таймаут')) {
      throw new Error(`timeout: ${data.error}`);
    }
    return { status: res.status(), data };
  }, `postMove`, 2);
}

export async function fetchGameState(request: APIRequestContext, roomId: string) {
  return retry(async () => {
    const res = await request.get(`${BASE}/api/game/${roomId}`);
    const data = await res.json();
    if (data.error && typeof data.error === 'string' && data.error.includes('таймаут')) {
      throw new Error(`timeout: ${data.error}`);
    }
    return data;
  }, `fetchGameState`, 2);
}
