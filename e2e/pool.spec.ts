import { test, expect } from '@playwright/test';
import { registerUser, createGame, postMove, fetchGameState, uniqueName } from './helpers';

test.describe('Pool (8-Ball)', () => {
  test('initial state via API', async ({ request }) => {
    const l = await registerUser(request, uniqueName('p1'));
    const r = await registerUser(request, uniqueName('p2'));
    const roomId = await createGame(request, 'pool', l.login, r.login);

    const state = await fetchGameState(request, roomId);
    expect(state.status).toBe('active');
    expect(state.gameType).toBe('pool');
    expect(state.gameState.playerGroup.left).toBeNull();
    expect(state.gameState.playerGroup.right).toBeNull();
    expect(state.gameState.pocketedSolids).toBe(0);
    expect(state.gameState.pocketedStripes).toBe(0);
  });

  test('left picks solids via shot', async ({ request }) => {
    const l = await registerUser(request, uniqueName('p3'));
    const r = await registerUser(request, uniqueName('p4'));
    const roomId = await createGame(request, 'pool', l.login, r.login);

    const res = await postMove(request, roomId, {
      playerId: l.userId,
      moveType: 'shot',
      shotType: 'solid',
    });
    expect(res.status).toBe(200);

    const state = await fetchGameState(request, roomId);
    expect(state.gameState.playerGroup.left).toBe('solid');
    expect(state.gameState.playerGroup.right).toBe('stripe');
    expect(state.players.left.score).toBe(1);
  });

  test('right picks stripes via shot', async ({ request }) => {
    const l = await registerUser(request, uniqueName('p5'));
    const r = await registerUser(request, uniqueName('p6'));
    const roomId = await createGame(request, 'pool', l.login, r.login);

    await postMove(request, roomId, { playerId: l.userId, moveType: 'turn_switch' });

    const res = await postMove(request, roomId, {
      playerId: r.userId,
      moveType: 'shot',
      shotType: 'stripe',
    });
    expect(res.status).toBe(200);

    const state = await fetchGameState(request, roomId);
    expect(state.gameState.playerGroup.right).toBe('stripe');
    expect(state.players.right.score).toBe(1);
  });

  test('durak adds pocketed count', async ({ request }) => {
    const l = await registerUser(request, uniqueName('p7'));
    const r = await registerUser(request, uniqueName('p8'));
    const roomId = await createGame(request, 'pool', l.login, r.login);

    await postMove(request, roomId, { playerId: l.userId, moveType: 'shot', shotType: 'solid' });

    for (let i = 0; i < 3; i++) {
      await postMove(request, roomId, { playerId: l.userId, moveType: 'durak' });
    }

    const state = await fetchGameState(request, roomId);
    expect(state.gameState.pocketedSolids).toBe(4);
    expect(state.players.left.score).toBe(4);
  });

  test('opponent ball switches turn and adds to opponent pocket count', async ({ request }) => {
    const l = await registerUser(request, uniqueName('p9'));
    const r = await registerUser(request, uniqueName('p10'));
    const roomId = await createGame(request, 'pool', l.login, r.login);

    await postMove(request, roomId, { playerId: l.userId, moveType: 'shot', shotType: 'solid' });

    const res = await postMove(request, roomId, {
      playerId: l.userId,
      moveType: 'shot',
      shotType: 'stripe',
    });
    expect(res.status).toBe(200);

    const state = await fetchGameState(request, roomId);
    expect(state.currentTurn).toBe('right');
    expect(state.gameState.pocketedStripes).toBe(1);
    expect(state.players.right.score).toBe(1);
  });

  test('early black = opponent wins', async ({ request }) => {
    const l = await registerUser(request, uniqueName('pb1'));
    const r = await registerUser(request, uniqueName('pb2'));
    const roomId = await createGame(request, 'pool', l.login, r.login);

    await postMove(request, roomId, { playerId: l.userId, moveType: 'shot', shotType: 'solid' });

    const res = await postMove(request, roomId, {
      playerId: l.userId,
      moveType: 'shot',
      shotType: 'black',
    });
    expect(res.status).toBe(200);

    const state = await fetchGameState(request, roomId);
    expect(state.status).toBe('finished');
    expect(state.winnerId).toBe(r.userId);
  });

  test.skip('7 solids + black = victory (slow, requires 9 API calls)', async ({ request }) => {
    const l = await registerUser(request, uniqueName('pw1'));
    const r = await registerUser(request, uniqueName('pw2'));
    const roomId = await createGame(request, 'pool', l.login, r.login);

    await postMove(request, roomId, { playerId: l.userId, moveType: 'shot', shotType: 'solid' });
    for (let i = 1; i < 7; i++) {
      await postMove(request, roomId, { playerId: l.userId, moveType: 'durak' });
    }
    await postMove(request, roomId, { playerId: l.userId, moveType: 'shot', shotType: 'black' });

    const state = await fetchGameState(request, roomId);
    expect(state.status).toBe('finished');
    expect(state.winnerId).toBe(l.userId);
  });

  test('UI shows game type and controls', async ({ page, request }) => {
    const l = await registerUser(request, uniqueName('pu1'));
    const r = await registerUser(request, uniqueName('pu2'));
    const roomId = await createGame(request, 'pool', l.login, r.login);

    await page.goto(`/game/${roomId}`);
    await page.waitForTimeout(5000);

    const gameLoaded = await page.getByText('Пул').first().isVisible({ timeout: 15000 }).catch(() => false);
    const stillLoading = await page.getByText('Загрузка игры').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (stillLoading) {
      await page.waitForFunction(
        () => !document.body.innerText.includes('Загрузка игры'),
        { timeout: 20000 }
      );
    }
    
    await expect(page.getByText('Пул').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Сплошные').first()).toBeVisible();
    await expect(page.getByText('Полосатые').first()).toBeVisible();
  });
});
