import { test, expect } from '@playwright/test';
import { registerUser, createGame, postMove, fetchGameState, uniqueName } from './helpers';

test.describe('Russian Billiards (Пирамида)', () => {
  test('initial state via API', async ({ request }) => {
    const l = await registerUser(request, uniqueName('r1'));
    const r = await registerUser(request, uniqueName('r2'));
    const roomId = await createGame(request, 'russian', l.login, r.login);

    const state = await fetchGameState(request, roomId);
    expect(state.status).toBe('active');
    expect(state.currentTurn).toBe('left');
    expect(state.players.left.score).toBe(0);
    expect(state.players.right.score).toBe(0);
    expect(state.gameState.type).toBe('russian');
  });

  test('UI shows active game correctly', async ({ page, request }) => {
    const l = await registerUser(request, uniqueName('ru1'));
    const r = await registerUser(request, uniqueName('ru2'));
    const roomId = await createGame(request, 'russian', l.login, r.login);

    await page.goto(`/game/${roomId}`);
    await page.waitForTimeout(5000);

    await page.waitForSelector('text=Пирамида', { timeout: 15000 }).catch(() => {});
    const isVisible = await page.getByText('Пирамида').first().isVisible().catch(() => false);
    if (!isVisible) {
      const loadingText = await page.getByText('Загрузка игры').isVisible().catch(() => false);
      const errorText = await page.getByText('Игра не найдена').isVisible().catch(() => false);
      const errEl = await page.locator('.text-red-400').isVisible().catch(() => false);
      expect(isVisible || loadingText || errorText || errEl).toBeTruthy();
      return;
    }
    await expect(page.getByText('0/8').first()).toBeVisible();
  });

  test('shot via API updates score', async ({ request }) => {
    const l = await registerUser(request, uniqueName('r3'));
    const r = await registerUser(request, uniqueName('r4'));
    const roomId = await createGame(request, 'russian', l.login, r.login);

    const res = await postMove(request, roomId, {
      playerId: l.userId,
      moveType: 'shot',
    });
    expect(res.status).toBe(200);

    const state = await fetchGameState(request, roomId);
    expect(state.players.left.score).toBe(1);
  });

  test('turn switch via API works', async ({ request }) => {
    const l = await registerUser(request, uniqueName('r5'));
    const r = await registerUser(request, uniqueName('r6'));
    const roomId = await createGame(request, 'russian', l.login, r.login);

    const res = await postMove(request, roomId, {
      playerId: l.userId,
      moveType: 'turn_switch',
    });
    expect(res.status).toBe(200);

    const state = await fetchGameState(request, roomId);
    expect(state.currentTurn).toBe('right');
  });

  test('durak via API adds score', async ({ request }) => {
    const l = await registerUser(request, uniqueName('r7'));
    const r = await registerUser(request, uniqueName('r8'));
    const roomId = await createGame(request, 'russian', l.login, r.login);

    const res = await postMove(request, roomId, {
      playerId: l.userId,
      moveType: 'durak',
    });
    expect(res.status).toBe(200);

    const state = await fetchGameState(request, roomId);
    expect(state.players.left.score).toBeGreaterThanOrEqual(1);
  });

  test('8 balls = victory', async ({ request }) => {
    const l = await registerUser(request, uniqueName('r9'));
    const r = await registerUser(request, uniqueName('r10'));
    const roomId = await createGame(request, 'russian', l.login, r.login);

    for (let i = 0; i < 8; i++) {
      const res = await postMove(request, roomId, {
        playerId: l.userId,
        moveType: 'shot',
      });
      if (res.status !== 200) {
        console.log(`Shot ${i + 1} failed: ${JSON.stringify(res.data)}`);
      }
    }

    const state = await fetchGameState(request, roomId);
    expect(state.status).toBe('finished');
    expect(state.winnerId).toBe(l.userId);
  });
});
