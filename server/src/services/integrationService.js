import { Integration } from '../models/Integration.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { GmailIntegration } from '../integrations/gmailIntegration.js';
import { SlackIntegration } from '../integrations/slackIntegration.js';
import { DiscordIntegration } from '../integrations/discordIntegration.js';
import { GoogleSheetsIntegration } from '../integrations/googleSheetsIntegration.js';

const providers = {
  gmail: new GmailIntegration(),
  slack: new SlackIntegration(),
  discord: new DiscordIntegration(),
  'google-sheets': new GoogleSheetsIntegration()
};

export class IntegrationService {
  /**
   * Get all integrations for a user with connection status
   */
  static async getUserIntegrations(userId) {
    const list = await Integration.find({ owner: userId }).lean();
    const map = {};
    for (const item of list) {
      map[item.provider] = item;
    }

    const allProviders = ['gmail', 'slack', 'discord', 'google-sheets'];
    return allProviders.map((p) => {
      const existing = map[p];
      return {
        provider: p,
        isConnected: existing ? existing.isConnected : false,
        accountEmail: existing?.accountEmail || null,
        accountName: existing?.accountName || null,
        expiresAt: existing?.expiresAt || null,
        hasWebhook: !!existing?.webhookUrl,
        updatedAt: existing?.updatedAt || null
      };
    });
  }

  /**
   * Get decrypted credentials for an integration
   */
  static async getDecryptedCredentials(userId, provider) {
    const integration = await Integration.findOne({ owner: userId, provider });
    if (!integration || !integration.isConnected) {
      return null;
    }

    return {
      accessToken: integration.encryptedAccessToken ? decrypt(integration.encryptedAccessToken) : null,
      refreshToken: integration.encryptedRefreshToken ? decrypt(integration.encryptedRefreshToken) : null,
      apiKey: integration.encryptedApiKey ? decrypt(integration.encryptedApiKey) : null,
      webhookUrl: integration.webhookUrl,
      expiresAt: integration.expiresAt,
      settings: integration.settings
    };
  }

  /**
   * Start OAuth flow for a provider
   */
  static getOAuthUrl(provider, state) {
    const instance = providers[provider];
    if (!instance) {
      throw new Error(`Invalid integration provider: ${provider}`);
    }
    return instance.getAuthUrl(state);
  }

  /**
   * Handle OAuth callback
   */
  static async handleOAuthCallback(userId, provider, code) {
    const instance = providers[provider];
    if (!instance) {
      throw new Error(`Invalid integration provider: ${provider}`);
    }

    const tokens = await instance.handleCallback(code);

    const updateData = {
      isConnected: true,
      accountEmail: tokens.accountEmail || null,
      accountName: tokens.accountName || null,
      expiresAt: tokens.expiresAt || null,
      webhookUrl: tokens.webhookUrl || null
    };

    if (tokens.accessToken) {
      updateData.encryptedAccessToken = encrypt(tokens.accessToken);
    }
    if (tokens.refreshToken) {
      updateData.encryptedRefreshToken = encrypt(tokens.refreshToken);
    }

    const integration = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return integration;
  }

  /**
   * Save manual credential / webhook URL / mock connection
   */
  static async saveManualCredentials(userId, { provider, accessToken, apiKey, webhookUrl, accountName, accountEmail }) {
    const updateData = {
      isConnected: true,
      accountEmail: accountEmail || 'manual@agentflow.ai',
      accountName: accountName || `${provider} (Manual)`,
      webhookUrl: webhookUrl || null
    };

    if (accessToken) {
      updateData.encryptedAccessToken = encrypt(accessToken);
    }
    if (apiKey) {
      updateData.encryptedApiKey = encrypt(apiKey);
    }

    const integration = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return integration;
  }

  /**
   * Disconnect integration
   */
  static async disconnect(userId, provider) {
    await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        $set: {
          isConnected: false,
          encryptedAccessToken: null,
          encryptedRefreshToken: null,
          encryptedApiKey: null,
          webhookUrl: null
        }
      }
    );
    return { success: true };
  }

  /**
   * Test integration health
   */
  static async checkStatus(userId, provider) {
    const credentials = await this.getDecryptedCredentials(userId, provider);
    if (!credentials) {
      return { provider, isConnected: false, valid: false, error: 'INTEGRATION_NOT_CONNECTED' };
    }

    const instance = providers[provider];
    if (!instance) {
      return { provider, isConnected: false, valid: false, error: 'UNKNOWN_PROVIDER' };
    }

    const testRes = await instance.testConnection(credentials);
    return {
      provider,
      isConnected: true,
      valid: testRes.valid,
      details: testRes
    };
  }

  /**
   * Execute an integration action on behalf of an agent
   */
  static async execute(userId, provider, actionName, params) {
    const credentials = await this.getDecryptedCredentials(userId, provider);
    const instance = providers[provider];
    if (!instance) {
      const err = new Error(`Unknown provider: ${provider}`);
      err.code = 'UNKNOWN_PROVIDER';
      throw err;
    }

    // Even if credentials is null, pass to instance so it throws clean INTEGRATION_NOT_CONNECTED or handles mock
    return instance.executeAction(actionName, params, credentials);
  }
}
