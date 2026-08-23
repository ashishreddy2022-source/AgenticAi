import { Router } from 'express';
import { body } from 'express-validator';
import { WorkflowController } from '../controllers/workflowController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = Router();

// Protect all workflow routes
router.use(authenticate);

router.get('/dashboard', WorkflowController.getDashboard);
router.get('/', WorkflowController.listWorkflows);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Workflow name is required'),
    validateRequest
  ],
  WorkflowController.createWorkflow
);

router.post(
  '/generate',
  [
    body('prompt').trim().notEmpty().withMessage('Prompt string is required'),
    validateRequest
  ],
  WorkflowController.generateFromPrompt
);

router.get('/:id', WorkflowController.getWorkflowById);
router.put('/:id', WorkflowController.updateWorkflow);
router.post('/:id/duplicate', WorkflowController.duplicateWorkflow);
router.post('/:id/execute', WorkflowController.executeWorkflow);
router.delete('/:id', WorkflowController.deleteWorkflow);

export default router;
