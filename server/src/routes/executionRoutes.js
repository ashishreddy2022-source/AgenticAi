import { Router } from 'express';
import { ExecutionController } from '../controllers/executionController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', ExecutionController.listExecutions);
router.get('/:id', ExecutionController.getExecutionById);
router.get('/:id/timeline', ExecutionController.getTimeline);
router.post('/:id/pause', ExecutionController.pauseExecution);
router.post('/:id/resume', ExecutionController.resumeExecution);
router.post('/:id/cancel', ExecutionController.cancelExecution);

export default router;
