import { IntegrationService } from '../services/integrationService.js';
import { config } from '../config/env.js';

export class IntegrationController {
  static async listIntegrations(req, res, next) {
    try {
      const integrations = await IntegrationService.getUserIntegrations(req.user.id);
      res.status(200).json({
        success: true,
        data: integrations
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStatus(req, res, next) {
    try {
      const allProviders = ['gmail', 'slack', 'discord', 'google-sheets'];
      const statuses = await Promise.all(
        allProviders.map((p) => IntegrationService.checkStatus(req.user.id, p))
      );
      res.status(200).json({
        success: true,
        data: statuses
      });
    } catch (error) {
      next(error);
    }
  }

  static async startOAuth(req, res, next) {
    try {
      const { provider } = req.params;
      const state = Buffer.from(JSON.stringify({ userId: req.user.id, provider, ts: Date.now() })).toString('base64');
      const authUrl = IntegrationService.getOAuthUrl(provider, state);
      res.status(200).json({
        success: true,
        data: { authUrl }
      });
    } catch (error) {
      next(error);
    }
  }

  static async oauthCallback(req, res, next) {
    try {
      const { provider } = req.params;
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`${config.clientUrl}/integrations?status=error&provider=${provider}&msg=${encodeURIComponent(error)}`);
      }

      let userId = req.user?.id;
      if (!userId && state) {
        try {
          const parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
          userId = parsedState.userId;
        } catch (e) {
          // ignore state parse error
        }
      }

      if (!userId) {
        return res.redirect(`${config.clientUrl}/integrations?status=error&msg=Authentication%20state%20missing`);
      }

      await IntegrationService.handleOAuthCallback(userId, provider, code || 'sandbox_mock_code');
      return res.redirect(`${config.clientUrl}/integrations?status=connected&provider=${provider}`);
    } catch (error) {
      return res.redirect(`${config.clientUrl}/integrations?status=error&provider=${req.params.provider}&msg=${encodeURIComponent(error.message)}`);
    }
  }

  static async oauthError(req, res, next) {
    res.status(400).json({
      success: false,
      error: 'OAUTH_ERROR',
      message: req.query.message || 'OAuth authorization was cancelled or failed'
    });
  }

  static async saveManual(req, res, next) {
    try {
      const integration = await IntegrationService.saveManualCredentials(req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Credentials updated successfully',
        data: integration
      });
    } catch (error) {
      next(error);
    }
  }

  static async disconnect(req, res, next) {
    try {
      const { provider } = req.params;
      const result = await IntegrationService.disconnect(req.user.id, provider);
      res.status(200).json({
        success: true,
        message: `Disconnected ${provider} integration`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
