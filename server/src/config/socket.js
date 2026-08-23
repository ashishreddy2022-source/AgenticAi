import { Server } from 'socket.io';
import { config } from './env.js';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for specific execution timeline
    socket.on('join:execution', (executionId) => {
      if (executionId) {
        socket.join(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined execution room: execution:${executionId}`);
      }
    });

    // Leave execution room
    socket.on('leave:execution', (executionId) => {
      if (executionId) {
        socket.leave(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left execution room: execution:${executionId}`);
      }
    });

    // Join room for user notifications
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user room: user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

/**
 * Emit an agent timeline event to the execution room and user room
 */
export function emitExecutionEvent(executionId, eventName, payload) {
  if (io) {
    io.to(`execution:${executionId}`).emit(eventName, payload);
    io.emit(eventName, { executionId, ...payload }); // Global broadcast for dashboard active feeds
  }
}

/**
 * Emit a notification to a specific user
 */
export function emitUserNotification(userId, notification) {
  if (io && userId) {
    io.to(`user:${userId}`).emit('notification:new', notification);
    io.emit('notification:new', notification); // Global fallback if needed
  }
}
