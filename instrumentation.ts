export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { execute } = await import('@/lib/db');

    console.log('[warmup] pinging Turso database...');
    const start = Date.now();

    try {
      await execute({ sql: 'SELECT 1' });
      console.log(`[warmup] database ready in ${Date.now() - start}ms`);
    } catch (error) {
      console.warn(
        `[warmup] database ping failed after ${Date.now() - start}ms:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}
