import { ExecutionLog } from '../models/ExecutionLog.js';
import { Notification } from '../models/Notification.js';
import { emitExecutionEvent, emitUserNotification } from '../config/socket.js';

/**
 * Monitoring Agent
 * Persists granular timeline events (ExecutionLog) and broadcasts real-time updates via Socket.IO.
 */
export class MonitoringAgent {
  /**
   * Records and emits an agent lifecycle event
   */
  static async logEvent({
    executionId,
    workflowId,
    userId,
    nodeId = null,
    agent, // 'planner' | 'execution' | 'validation' | 'recovery' | 'monitoring' | 'system'
    level = 'info', // 'info' | 'warning' | 'error' | 'success'
    message,
    metadata = {}
  }) {
    try {
      // 1. Persist log row
      const logEntry = await ExecutionLog.create({
        executionId,
        workflowId,
        nodeId,
        agent,
        level,
        message,
        metadata,
        timestamp: new Date()
      });

      // 2. Broadcast via Socket.IO
      emitExecutionEvent(executionId.toString(), 'execution:log', {
        _id: logEntry._id,
        executionId: executionId.toString(),
        workflowId: workflowId.toString(),
        nodeId,
        agent,
        level,
        message,
        metadata,
        timestamp: logEntry.timestamp
      });

      return logEntry;
    } catch (err) {
      console.error('[MonitoringAgent] Failed to persist/emit log event:', err.message);
    }
  }

  /**
   * Creates an operator alert / notification and broadcasts it
   */
  static async notify({
    userId,
    workflowId = null,
    executionId = null,
    type = 'info', // 'info' | 'success' | 'warning' | 'error' | 'escalation'
    title,
    message
  }) {
    try {
      const notification = await Notification.create({
        owner: userId,
        workflowId,
        executionId,
        type,
        title,
        message,
        isRead: false
      });

      emitUserNotification(userId.toString(), notification);
      return notification;
    } catch (err) {
      console.error('[MonitoringAgent] Failed to create notification:', err.message);
    }
  }
}
