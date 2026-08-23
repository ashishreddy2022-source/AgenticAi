import { BaseIntegration } from './baseIntegration.js';
import { config } from '../config/env.js';

export class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  getAuthUrl(state) {
    const { clientId, redirectUri } = config.oauth.discord;
    if (!clientId) {
      return `/integrations?mock=discord&state=${state}`;
    }
    const permissions = '2048'; // Send Messages
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
  }

  async handleCallback(code) {
    const { clientId, clientSecret, redirectUri } = config.oauth.discord;
    if (!clientId || !clientSecret) {
      return {
        accessToken: `mock_discord_token_${Date.now()}`,
        webhookUrl: 'https://discord.com/api/webhooks/MOCK/TOKEN/EXAMPLE',
        accountName: 'Agentflow Bot Server'
      };
    }

    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || 'Discord OAuth exchange failed');
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accountName: data.guild?.name || 'Discord Server',
      webhookUrl: data.webhook?.url
    };
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.webhookUrl && !config.oauth.discord.botToken)) {
      return { valid: false, error: 'INTEGRATION_NOT_CONNECTED' };
    }
    if (credentials.accessToken?.startsWith('mock_')) {
      return { valid: true, server: 'Agentflow Demo Guild' };
    }
    try {
      if (credentials.webhookUrl) {
        const res = await fetch(credentials.webhookUrl);
        const data = await res.json();
        return { valid: res.ok, name: data.name, channelId: data.channel_id };
      }
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  async executeAction(actionName, params, credentials) {
    const { message, content, embeds, channelId } = params;
    const msgText = content || message;

    if (!msgText && !embeds) {
      const err = new Error('Message content or embeds required for Discord');
      err.code = 'MISSING_FIELDS';
      throw err;
    }

    if (!credentials || (!credentials.accessToken && !credentials.webhookUrl && !config.oauth.discord.botToken)) {
      const err = new Error('Discord integration is not connected');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (credentials.accessToken?.startsWith('mock_') || (credentials.webhookUrl && credentials.webhookUrl.includes('MOCK'))) {
      return {
        status: 'success',
        provider: 'discord',
        id: `disc_${Date.now()}`,
        content: msgText,
        channelId: channelId || 'mock-channel-id',
        sentAt: new Date().toISOString(),
        mode: 'sandbox'
      };
    }

    // Webhook execution
    if (credentials.webhookUrl) {
      const response = await fetch(credentials.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msgText, embeds })
      });
      if (!response.ok) {
        const err = new Error(`Discord webhook error: ${response.statusText}`);
        err.code = 'API_FAILURE';
        throw err;
      }
      return { status: 'success', provider: 'discord', type: 'webhook', sentAt: new Date().toISOString() };
    }

    // Bot token execution to channel
    const token = credentials.accessToken || config.oauth.discord.botToken;
    if (!channelId) {
      const err = new Error('channelId is required for Discord Bot messaging');
      err.code = 'MISSING_FIELDS';
      throw err;
    }

    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: msgText, embeds })
    });

    if (!response.ok) {
      const errData = await response.json();
      const err = new Error(errData.message || 'Discord message send failed');
      err.code = response.status === 401 ? 'AUTH_EXPIRED' : (response.status === 429 ? 'RATE_LIMIT' : 'API_FAILURE');
      throw err;
    }

    const resData = await response.json();
    return {
      status: 'success',
      provider: 'discord',
      id: resData.id,
      channelId: resData.channel_id,
      sentAt: new Date().toISOString()
    };
  }
}
