import { Router } from 'express';
import { body } from 'express-validator';
import { IntegrationController } from '../controllers/integrationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = Router();

// OAuth callback does not require Bearer token in header because it is a browser redirect
router.get('/oauth/:provider/callback', IntegrationController.oauthCallback);
router.get('/oauth/error', IntegrationController.oauthError);

// Protected routes
router.use(authenticate);

router.get('/', IntegrationController.listIntegrations);
router.get('/status', IntegrationController.getStatus);
router.get('/oauth/:provider/start', IntegrationController.startOAuth);

router.post(
  '/',
  [
    body('provider').isIn(['gmail', 'slack', 'discord', 'google-sheets']).withMessage('Valid provider is required'),
    validateRequest
  ],
  IntegrationController.saveManual
);

router.delete('/:provider', IntegrationController.disconnect);

export default router;
