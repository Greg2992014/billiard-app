import { createClient, type Client } from '@libsql/client';

const QUERY_TIMEOUT_MS = 8_000;
const BATCH_TIMEOUT_MS = 12_000;
const RETRY_DELAY_MS = 1_000;
const MAX_RETRIES = 1;

let _turso: Client | null = null;

function getClient(): Client {
  if (!_turso) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) {
      throw new Error(
        'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required',
      );
    }
    _turso = createClient({ url, authToken });
  }
  return _turso;
}

export function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const msg = error.message || '';
  if (
    error.name === 'AbortError' ||
    error.name === 'TimeoutError' ||
    error.name === 'ConnectTimeoutError' ||
    msg.includes('UND_ERR_CONNECT_TIMEOUT') ||
    msg.includes('timed out') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('fetch failed')
  ) {
    return true;
  }

  let cause: unknown = (error as Error & { cause?: unknown }).cause;
  while (cause instanceof Error) {
    const causeMsg = cause.message || '';
    if (
      cause.name === 'AbortError' ||
      cause.name === 'TimeoutError' ||
      cause.name === 'ConnectTimeoutError' ||
      causeMsg.includes('UND_ERR_CONNECT_TIMEOUT') ||
      causeMsg.includes('timed out') ||
      causeMsg.includes('ETIMEDOUT') ||
      causeMsg.includes('fetch failed')
    ) {
      return true;
    }
    cause = (cause as Error & { cause?: unknown }).cause;
  }

  return false;
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

async function withTimeoutRetry<T>(
  fn: () => Promise<T>,
  label: string,
  timeoutMs = QUERY_TIMEOUT_MS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new TimeoutError('Database query timed out')),
          timeoutMs,
        );
      });

      try {
        const result = await Promise.race([fn(), timeoutPromise]);
        return result;
      } finally {
        if (timer) clearTimeout(timer);
      }
    } catch (error) {
      lastError = error;

      if (!isTimeoutError(error) || attempt >= MAX_RETRIES) {
        throw error;
      }

      console.warn(`[db] ${label} retry ${attempt + 1}/${MAX_RETRIES} after timeout`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  throw lastError;
}

export async function execute(
  stmt: { sql: string; args?: readonly (string | number | null)[] },
) {
  return withTimeoutRetry(
    () =>
      getClient().execute({
        sql: stmt.sql,
        args: (stmt.args ?? []) as (string | number | null)[],
      }),
    'query',
  );
}

let migrationsApplied = false;

export async function ensureMigrations(): Promise<void> {
  if (migrationsApplied) return;

  try {
    const cols = await execute({ sql: "PRAGMA table_info(games)" });
    const hasClosed = cols.rows.some((r: Record<string, unknown>) => r.name === 'closed');
    if (!hasClosed) {
      await execute({ sql: 'ALTER TABLE games ADD COLUMN closed INTEGER DEFAULT 0' });
      console.log('[db] Applied migration: added games.closed column');
    }
    migrationsApplied = true;
  } catch (e) {
    console.warn('[db] Migration check failed (non-fatal):', e);
    migrationsApplied = true; // don't retry every request
  }
}

export async function batch(
  statements: { sql: string; args: (string | number | null)[] }[],
  timeoutMs = BATCH_TIMEOUT_MS,
) {
  return withTimeoutRetry(
    () => getClient().batch(statements, 'write'),
    'batch',
    timeoutMs,
  );
}
