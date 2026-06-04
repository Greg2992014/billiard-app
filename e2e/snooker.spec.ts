import { test, expect } from '@playwright/test';
import { registerUser, createGame, postMove, fetchGameState, uniqueName } from './helpers';

test.describe('Snooker', () => {
  test('initial state via API', async ({ request }) => {
    const l = await registerUser(request, uniqueName('s1'));
    const r = await registerUser(request, uniqueName('s2'));
    const roomId = await createGame(request, 'snooker', l.login, r.login);

    const state = await fetchGameState(request, roomId);
    expect(state.gameState.reds).toBe(15);
    expect(state.gameState.requiredBallType).toBe('red');
    expect(state.gameState.phase).toBe('normal');
    expect(state.status).toBe('active');
  });

  test('pocket red → requiredBallType = color', async ({ request }) => {
    const l = await registerUser(request, uniqueName('s3'));
    const r = await registerUser(request, uniqueName('s4'));
    const roomId = await createGame(request, 'snooker', l.login, r.login);

    const res = await postMove(request, roomId, {
      playerId: l.userId,
      moveType: 'shot',
      ballColor: 'red',
    });
    expect(res.status).toBe(200);

    const state = await fetchGameState(request, roomId);
    expect(state.players.left.score).toBeGreaterThanOrEqual(1);
    expect(state.gameState.reds).toBe(14);
    expect(state.gameState.requiredBallType).toBe('color');
  });

  test('pocket red then black → requiredBallType = red', async ({ request }) => {
    const l = await registerUser(request, uniqueName('s5'));
    const r = await registerUser(request, uniqueName('s6'));
    const roomId = await createGame(request, 'snooker', l.login, r.login);

    await postMove(request, roomId, { playerId: l.userId, moveType: 'shot', ballColor: 'red' });
    await postMove(request, roomId, { playerId: l.userId, moveType: 'shot', ballColor: 'black' });

    const state = await fetchGameState(request, roomId);
    expect(state.gameState.requiredBallType).toBe('red');
    expect(state.players.left.score).toBeGreaterThanOrEqual(8);
  });

  test('turn switch resets requiredBallType to red', async ({ request }) => {
    const l = await registerUser(request, uniqueName('s7'));
    const r = await registerUser(request, uniqueName('s8'));
    const roomId = await createGame(request, 'snooker', l.login, r.login);

    await postMove(request, roomId, { playerId: l.userId, moveType: 'shot', ballColor: 'red' });
    await postMove(request, roomId, { playerId: l.userId, moveType: 'turn_switch' });

    const state = await fetchGameState(request, roomId);
    expect(state.currentTurn).toBe('right');
    expect(state.gameState.requiredBallType).toBe('red');
  });

  test('foul adds points to opponent', async ({ request }) => {
    const l = await registerUser(request, uniqueName('s9'));
    const r = await registerUser(request, uniqueName('s10'));
    const roomId = await createGame(request, 'snooker', l.login, r.login);

    await postMove(request, roomId, {
      playerId: l.userId,
      moveType: 'foul',
      foulPoints: 4,
    });

    const state = await fetchGameState(request, roomId);
    expect(state.currentTurn).toBe('right');
    expect(state.players.right.score).toBeGreaterThanOrEqual(4);
  });

  test('foul during shot (wrong ball) switches turn', async ({ request }) => {
    const l = await registerUser(request, uniqueName('sf1'));
    const r = await registerUser(request, uniqueName('sf2'));
    const roomId = await createGame(request, 'snooker', l.login, r.login);

    const res = await postMove(request, roomId, {
      playerId: l.userId,
      moveType: 'shot',
      ballColor: 'black',
    });
    expect(res.status).toBe(200);

    const state = await fetchGameState(request, roomId);
    expect(state.currentTurn).toBe('right');
    expect(state.players.right.score).toBeGreaterThanOrEqual(0);
  });

  test('durak pockets a red', async ({ request }) => {
    const l = await registerUser(request, uniqueName('sd1'));
    const r = await registerUser(request, uniqueName('sd2'));
    const roomId = await createGame(request, 'snooker', l.login, r.login);

    await postMove(request, roomId, {
      playerId: l.userId,
      moveType: 'durak',
      ballColor: 'red',
    });

    const state = await fetchGameState(request, roomId);
    expect(state.gameState.reds).toBe(14);
    expect(state.players.left.score).toBeGreaterThanOrEqual(1);
  });

  test('durak with wrong ball gives foul points to opponent', async ({ request }) => {
    const l = await registerUser(request, uniqueName('sdf1'));
    const r = await registerUser(request, uniqueName('sdf2'));
    const roomId = await createGame(request, 'snooker', l.login, r.login);

    const res = await postMove(request, roomId, {
      playerId: l.userId,
      moveType: 'durak',
      ballColor: 'black',
    });
    expect(res.status).toBe(200);

    const state = await fetchGameState(request, roomId);
    expect(state.currentTurn).toBe('right');
    expect(state.players.right.score).toBeGreaterThanOrEqual(7);
    expect(state.players.left.score).toBe(0);
  });

  test('UI shows snooker game with controls', async ({ page, request }) => {
    const l = await registerUser(request, uniqueName('su1'));
    const r = await registerUser(request, uniqueName('su2'));
    const roomId = await createGame(request, 'snooker', l.login, r.login);

    await page.goto(`/game/${roomId}`);
    await page.waitForTimeout(3000);

    await expect(page.getByText('Снукер').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Красный').first()).toBeVisible();
  });
});
