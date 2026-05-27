import { io, type Socket } from 'socket.io-client';

function getDefaultWsUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }

  return 'https://steward-backend.onrender.com';
}

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, '') ||
  getDefaultWsUrl();

let socket: Socket | null = null;
let activeConsumers = 0;

export function getSocket(accessToken?: string): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      timeout: 20_000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: accessToken ? { token: accessToken } : {},
    });
  } else if (accessToken) {
    (socket as any).auth = { token: accessToken };
  }
  return socket;
}

export function acquireSocket(accessToken: string): Socket {
  activeConsumers += 1;
  return getSocket(accessToken);
}

export function releaseSocket(): void {
  activeConsumers = Math.max(0, activeConsumers - 1);
  if (activeConsumers === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    activeConsumers = 0;
  }
}

export function updateSocketAuth(token: string): void {
  if (!socket) return;
  (socket as any).auth = { token };
  // Force reconnect so the new token is used in the next handshake
  if (socket.connected) {
    socket.disconnect().connect();
  }
}
