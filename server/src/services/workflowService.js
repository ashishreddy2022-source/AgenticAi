import { Workflow } from '../models/Workflow.js';
import { Execution } from '../models/Execution.js';
import { ExecutionLog } from '../models/ExecutionLog.js';

export class WorkflowService {
  /**
   * Create new workflow
   */
  static async createWorkflow(data, userId) {
    const workflow = await Workflow.create({
      ...data,
      owner: userId,
      version: 1
    });
    return workflow;
  }

  /**
   * List workflows with search, tag filters, pagination
   */
  static async listWorkflows(userId, { search, tag, status, page = 1, limit = 20 } = {}) {
    const query = { owner: userId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (tag) {
      query.tags = tag;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [workflows, total] = await Promise.all([
      Workflow.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Workflow.countDocuments(query)
    ]);

    return {
      workflows,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Get workflow by ID
   */
  static async getWorkflowById(workflowId, userId) {
    const workflow = await Workflow.findOne({ _id: workflowId, owner: userId }).lean();
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }
    return workflow;
  }

  /**
   * Update workflow structure, nodes, edges
   */
  static async updateWorkflow(workflowId, data, userId) {
    const workflow = await Workflow.findOne({ _id: workflowId, owner: userId });
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }

    if (data.name !== undefined) workflow.name = data.name;
    if (data.description !== undefined) workflow.description = data.description;
    if (data.status !== undefined) workflow.status = data.status;
    if (data.triggerConfig !== undefined) workflow.triggerConfig = data.triggerConfig;
    if (data.nodes !== undefined) workflow.nodes = data.nodes;
    if (data.edges !== undefined) workflow.edges = data.edges;
    if (data.tags !== undefined) workflow.tags = data.tags;

    // Increment version number on structural node/edge edits
    if (data.nodes || data.edges) {
      workflow.version = (workflow.version || 1) + 1;
    }

    await workflow.save();
    return workflow;
  }

  /**
   * Duplicate workflow
   */
  static async duplicateWorkflow(workflowId, userId) {
    const original = await Workflow.findOne({ _id: workflowId, owner: userId }).lean();
    if (!original) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }

    const { _id, createdAt, updatedAt, ...cloneData } = original;
    const duplicated = await Workflow.create({
      ...cloneData,
      name: `${original.name} (Copy)`,
      version: 1,
      owner: userId
    });

    return duplicated;
  }

  /**
   * Delete workflow
   */
  static async deleteWorkflow(workflowId, userId) {
    const result = await Workflow.findOneAndDelete({ _id: workflowId, owner: userId });
    if (!result) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }
    return { success: true, message: 'Workflow deleted successfully' };
  }

  /**
   * Aggregated dashboard metrics & recent activity
   */
  static async getDashboardMetrics(userId) {
    const [
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      completedExecutions,
      failedExecutions,
      recentExecutions,
      recentLogs
    ] = await Promise.all([
      Workflow.countDocuments({ owner: userId }),
      Workflow.countDocuments({ owner: userId, status: 'active' }),
      Execution.countDocuments({ owner: userId }),
      Execution.countDocuments({ owner: userId, status: 'COMPLETED' }),
      Execution.countDocuments({ owner: userId, status: 'FAILED' }),
      Execution.find({ owner: userId })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('workflowId', 'name tags')
        .lean(),
      ExecutionLog.find()
        .sort({ timestamp: -1 })
        .limit(8)
        .populate('workflowId', 'name')
        .lean()
    ]);

    const successRate = totalExecutions > 0
      ? Math.round((completedExecutions / totalExecutions) * 100)
      : 100;

    // Calculate average duration of completed executions
    const completedList = await Execution.find({ owner: userId, status: 'COMPLETED', duration: { $gt: 0 } })
      .select('duration')
      .limit(50)
      .lean();

    const avgDurationMs = completedList.length > 0
      ? Math.round(completedList.reduce((acc, curr) => acc + (curr.duration || 0), 0) / completedList.length)
      : 2450;

    return {
      metrics: {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        completedExecutions,
        failedExecutions,
        successRate,
        avgDurationMs,
        activeAgents: 5 // Planner, Execution, Validation, Recovery, Monitoring
      },
      recentExecutions,
      recentLogs
    };
  }
}
