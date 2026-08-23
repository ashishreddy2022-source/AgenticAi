import { WorkflowService } from '../services/workflowService.js';
import { AIService } from '../services/aiService.js';
import { ExecutionService } from '../services/executionService.js';

export class WorkflowController {
  static async getDashboard(req, res, next) {
    try {
      const stats = await WorkflowService.getDashboardMetrics(req.user.id);
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  static async listWorkflows(req, res, next) {
    try {
      const { search, tag, status, page, limit } = req.query;
      const result = await WorkflowService.listWorkflows(req.user.id, {
        search,
        tag,
        status,
        page,
        limit
      });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async createWorkflow(req, res, next) {
    try {
      const workflow = await WorkflowService.createWorkflow(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Workflow created successfully',
        data: workflow
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateFromPrompt(req, res, next) {
    try {
      const { prompt } = req.body;
      const generated = await AIService.generateWorkflowFromPrompt(prompt);
      res.status(200).json({
        success: true,
        message: 'Workflow generated successfully from prompt',
        data: generated
      });
    } catch (error) {
      next(error);
    }
  }

  static async getWorkflowById(req, res, next) {
    try {
      const workflow = await WorkflowService.getWorkflowById(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: workflow
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateWorkflow(req, res, next) {
    try {
      const workflow = await WorkflowService.updateWorkflow(req.params.id, req.body, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Workflow updated successfully',
        data: workflow
      });
    } catch (error) {
      next(error);
    }
  }

  static async duplicateWorkflow(req, res, next) {
    try {
      const workflow = await WorkflowService.duplicateWorkflow(req.params.id, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Workflow duplicated successfully',
        data: workflow
      });
    } catch (error) {
      next(error);
    }
  }

  static async executeWorkflow(req, res, next) {
    try {
      const { inputs } = req.body;
      const execution = await ExecutionService.startExecution(req.params.id, req.user.id, inputs);
      res.status(201).json({
        success: true,
        message: 'Workflow execution queued and started',
        data: execution
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteWorkflow(req, res, next) {
    try {
      const result = await WorkflowService.deleteWorkflow(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
