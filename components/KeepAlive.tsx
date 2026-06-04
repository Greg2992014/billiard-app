'use client';

import { useEffect, useRef } from 'react';

const PING_INTERVAL_MS = 1 * 60 * 1000; // 1 minutes
const FIRST_PING_DELAY_MS = 10_000; // delay first ping to avoid racing with user login

/**
 * Invisible component that periodically pings the /api/health endpoint
 * to prevent the Turso free-tier database from entering sleep mode.
 * Mount this in the root layout so it runs on every page.
 *
 * The first ping is delayed by 10 seconds to avoid racing with the user's
 * first login request — both would hit the cold database simultaneously,
 * causing multiple TLS handshakes to hang.
 */
export function KeepAlive() {
  const mountedRef = useRef(false);

  useEffect(() => {
    // React StrictMode in dev double-mounts effects — guard against that.
    let cancelled = false;

    if (!mountedRef.current) {
      mountedRef.current = true;
    } else {
      return; // second mount in StrictMode — skip
    }

    const ping = () => {
      if (cancelled) return;
      fetch('/api/health', { cache: 'no-store' }).catch(() => {
        // Silently ignore — best-effort keep-alive
      });
    };

    // Delay first ping so user-initiated requests (login, page data)
    // are the only ones hitting the cold database.
    const firstTimer = setTimeout(ping, FIRST_PING_DELAY_MS);

    // Then ping every 2.5 minutes
    const interval = setInterval(ping, PING_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, []);

  return null; // Renders nothing
}
