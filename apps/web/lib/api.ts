export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/**
 * Origin of the NestJS backend for websocket connections. This must be the
 * bare origin (NO `/api` suffix) — socket.io namespaces are appended to it.
 */
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';
