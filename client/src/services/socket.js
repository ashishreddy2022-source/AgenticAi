import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function getSocket() {
  if (!socket && typeof window !== 'undefined') {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to Agentflow Server, id:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });
  }
  return socket;
}

export function joinExecutionRoom(executionId) {
  const s = getSocket();
  if (s && executionId) {
    s.emit('join:execution', executionId);
  }
}

export function leaveExecutionRoom(executionId) {
  const s = getSocket();
  if (s && executionId) {
    s.emit('leave:execution', executionId);
  }
}

export function joinUserRoom(userId) {
  const s = getSocket();
  if (s && userId) {
    s.emit('join:user', userId);
  }
}
