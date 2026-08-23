import { Execution } from '../models/Execution.js';
import { Workflow } from '../models/Workflow.js';
import { ExecutionLog } from '../models/ExecutionLog.js';
import { queueExecution } from '../queues/executionQueue.js';
import { emitExecutionEvent } from '../config/socket.js';
import { MonitoringAgent } from '../agents/monitoringAgent.js';

export class ExecutionService {
  /**
   * Start a new workflow execution
   */
  static async startExecution(workflowId, userId, inputs = {}) {
    const workflow = await Workflow.findOne({ _id: workflowId, owner: userId });
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }

    if (workflow.nodes.length === 0) {
      const err = new Error('Cannot execute empty workflow. Add at least one node.');
      err.statusCode = 400;
      throw err;
    }

    // Create immutable runtime snapshot
    const workflowSnapshot = {
      name: workflow.name,
      version: workflow.version,
      nodes: JSON.parse(JSON.stringify(workflow.nodes)),
      edges: JSON.parse(JSON.stringify(workflow.edges))
    };

    const execution = await Execution.create({
      workflowId: workflow._id,
      owner: userId,
      workflowSnapshot,
      status: 'PENDING',
      inputs,
      startTime: new Date(),
      agentConfidence: 0.95,
      langGraphStatus: 'available'
    });

    // Enqueue for processing
    await queueExecution(execution._id.toString());

    return execution;
  }

  /**
   * List executions with filtering and pagination
   */
  static async listExecutions(userId, { status, workflowId, page = 1, limit = 20 } = {}) {
    const query = { owner: userId };
    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }
    if (workflowId) {
      query.workflowId = workflowId;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [executions, total] = await Promise.all([
      Execution.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('workflowId', 'name tags status')
        .lean(),
      Execution.countDocuments(query)
    ]);

    return {
      executions,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Get single execution details
   */
  static async getExecutionById(executionId, userId) {
    const execution = await Execution.findOne({ _id: executionId, owner: userId })
      .populate('workflowId', 'name description tags')
      .lean();

    if (!execution) {
      const err = new Error('Execution not found');
      err.statusCode = 404;
      throw err;
    }

    return execution;
  }

  /**
   * Fetch timeline logs for an execution
   */
  static async getExecutionTimeline(executionId, userId) {
    const execution = await Execution.findOne({ _id: executionId, owner: userId });
    if (!execution) {
      const err = new Error('Execution not found');
      err.statusCode = 404;
      throw err;
    }

    const logs = await ExecutionLog.find({ executionId }).sort({ timestamp: 1 }).lean();
    return logs;
  }

  /**
   * Pause a running execution
   */
  static async pauseExecution(executionId, userId) {
    const execution = await Execution.findOne({ _id: executionId, owner: userId });
    if (!execution) {
      const err = new Error('Execution not found');
      err.statusCode = 404;
      throw err;
    }

    if (execution.status !== 'RUNNING' && execution.status !== 'PENDING') {
      const err = new Error(`Cannot pause execution with status ${execution.status}`);
      err.statusCode = 400;
      throw err;
    }

    execution.status = 'PAUSED';
    await execution.save();

    emitExecutionEvent(executionId.toString(), 'execution:status_change', {
      executionId: executionId.toString(),
      status: 'PAUSED'
    });

    await MonitoringAgent.logEvent({
      executionId,
      workflowId: execution.workflowId,
      userId,
      agent: 'system',
      level: 'warning',
      message: 'Operator requested execution pause.'
    });

    return execution;
  }

  /**
   * Resume a paused execution
   */
  static async resumeExecution(executionId, userId) {
    const execution = await Execution.findOne({ _id: executionId, owner: userId });
    if (!execution) {
      const err = new Error('Execution not found');
      err.statusCode = 404;
      throw err;
    }

    if (execution.status !== 'PAUSED') {
      const err = new Error(`Cannot resume execution with status ${execution.status}`);
      err.statusCode = 400;
      throw err;
    }

    execution.status = 'RUNNING';
    await execution.save();

    await MonitoringAgent.logEvent({
      executionId,
      workflowId: execution.workflowId,
      userId,
      agent: 'system',
      level: 'info',
      message: 'Operator resumed workflow execution.'
    });

    await queueExecution(execution._id.toString());
    return execution;
  }

  /**
   * Cancel an active execution
   */
  static async cancelExecution(executionId, userId) {
    const execution = await Execution.findOne({ _id: executionId, owner: userId });
    if (!execution) {
      const err = new Error('Execution not found');
      err.statusCode = 404;
      throw err;
    }

    if (['COMPLETED', 'CANCELLED', 'FAILED'].includes(execution.status)) {
      const err = new Error(`Execution is already in terminal state: ${execution.status}`);
      err.statusCode = 400;
      throw err;
    }

    execution.status = 'CANCELLED';
    execution.endTime = new Date();
    execution.duration = execution.endTime - (execution.startTime || execution.createdAt);
    await execution.save();

    emitExecutionEvent(executionId.toString(), 'execution:status_change', {
      executionId: executionId.toString(),
      status: 'CANCELLED'
    });

    await MonitoringAgent.logEvent({
      executionId,
      workflowId: execution.workflowId,
      userId,
      agent: 'system',
      level: 'warning',
      message: 'Operator cancelled workflow execution.'
    });

    return execution;
  }
}
