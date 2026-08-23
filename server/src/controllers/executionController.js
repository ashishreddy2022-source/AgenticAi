import { ExecutionService } from '../services/executionService.js';

export class ExecutionController {
  static async listExecutions(req, res, next) {
    try {
      const { status, workflowId, page, limit } = req.query;
      const result = await ExecutionService.listExecutions(req.user.id, {
        status,
        workflowId,
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

  static async getExecutionById(req, res, next) {
    try {
      const execution = await ExecutionService.getExecutionById(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: execution
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTimeline(req, res, next) {
    try {
      const timeline = await ExecutionService.getExecutionTimeline(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: timeline
      });
    } catch (error) {
      next(error);
    }
  }

  static async pauseExecution(req, res, next) {
    try {
      const execution = await ExecutionService.pauseExecution(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Execution paused',
        data: execution
      });
    } catch (error) {
      next(error);
    }
  }

  static async resumeExecution(req, res, next) {
    try {
      const execution = await ExecutionService.resumeExecution(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Execution resumed',
        data: execution
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelExecution(req, res, next) {
    try {
      const execution = await ExecutionService.cancelExecution(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Execution cancelled',
        data: execution
      });
    } catch (error) {
      next(error);
    }
  }
}
