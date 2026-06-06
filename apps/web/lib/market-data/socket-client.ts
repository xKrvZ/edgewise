'use client';

import { WS_URL } from '@/lib/api';
import { api } from '@/lib/api-client';
import { type Socket, io } from 'socket.io-client';

/**
 * Lazily-created singleton socket to the backend `/market-data` namespace.
 *
 * Auth reuses the existing short-lived JWT flow: `auth` is provided as a
 * function so socket.io invokes it on every (re)connection, letting us fetch a
 * fresh token from `POST /api/socket/token` on the initial connect AND on each
 * reconnect (tokens expire after 60s). The cookie-authenticated api-client
 * performs the exchange.
 */
let socket: Socket | null = null;

export function getMarketDataSocket(): Socket {
  if (socket) return socket;

  socket = io(`${WS_URL}/market-data`, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Number.POSITIVE_INFINITY,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    // Called on initial connect and before every reconnect attempt, so the
    // handshake always carries a fresh, unexpired socket token.
    auth: (cb: (data: Record<string, unknown>) => void) => {
      api.socket
        .token()
        .then(({ accessToken }) => cb({ accessToken }))
        .catch(() => cb({}));
    },
  });

  return socket;
}

/** Tears down the singleton socket (useful for logout / tests). */
export function disconnectMarketDataSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
