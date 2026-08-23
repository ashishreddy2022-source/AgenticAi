import { BaseIntegration } from './baseIntegration.js';
import { config } from '../config/env.js';

export class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  getAuthUrl(state) {
    const { clientId, redirectUri } = config.oauth.slack;
    if (!clientId) {
      return `/integrations?mock=slack&state=${state}`;
    }
    const scopes = encodeURIComponent('chat:write,channels:read,incoming-webhook');
    return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  async handleCallback(code) {
    const { clientId, clientSecret, redirectUri } = config.oauth.slack;
    if (!clientId || !clientSecret) {
      return {
        accessToken: `mock_slack_token_${Date.now()}`,
        webhookUrl: 'https://hooks.slack.com/services/MOCK/TOKEN/EXAMPLE',
        accountName: 'Agentflow Ops Workspace'
      };
    }

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      })
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error || 'Slack OAuth exchange failed');
    }

    return {
      accessToken: data.access_token,
      webhookUrl: data.incoming_webhook?.url,
      accountName: data.team?.name || 'Slack Team'
    };
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.webhookUrl)) {
      return { valid: false, error: 'INTEGRATION_NOT_CONNECTED' };
    }
    if (credentials.accessToken?.startsWith('mock_')) {
      return { valid: true, workspace: 'Agentflow Sandbox Team' };
    }
    try {
      const res = await fetch('https://slack.com/api/auth.test', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` }
      });
      const data = await res.json();
      return { valid: data.ok, team: data.team, user: data.user, error: data.error };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  async executeAction(actionName, params, credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.webhookUrl)) {
      const err = new Error('Slack integration is not connected');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    const { channel = '#general', message, text, blocks } = params;
    const msgContent = text || message;

    if (!msgContent && !blocks) {
      const err = new Error('Message text or blocks required for Slack');
      err.code = 'MISSING_FIELDS';
      throw err;
    }

    if (credentials.accessToken?.startsWith('mock_') || (!credentials.accessToken && credentials.webhookUrl?.includes('MOCK'))) {
      return {
        status: 'success',
        provider: 'slack',
        channel: channel || '#ops-alerts',
        ts: `${Date.now() / 1000}`,
        message: msgContent,
        sentAt: new Date().toISOString(),
        mode: 'sandbox'
      };
    }

    // Direct Webhook URL execution
    if (credentials.webhookUrl && (!credentials.accessToken || actionName === 'webhook_post')) {
      const response = await fetch(credentials.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msgContent, channel, blocks })
      });
      if (!response.ok) {
        const err = new Error(`Slack webhook error: ${response.statusText}`);
        err.code = 'API_FAILURE';
        throw err;
      }
      return { status: 'success', provider: 'slack', type: 'webhook', sentAt: new Date().toISOString() };
    }

    // Web API execution
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel,
        text: msgContent,
        blocks
      })
    });

    const data = await response.json();
    if (!data.ok) {
      const err = new Error(data.error || 'Slack chat.postMessage failed');
      err.code = data.error === 'invalid_auth' ? 'AUTH_EXPIRED' : (data.error === 'ratelimited' ? 'RATE_LIMIT' : 'API_FAILURE');
      throw err;
    }

    return {
      status: 'success',
      provider: 'slack',
      channel: data.channel,
      ts: data.ts,
      sentAt: new Date().toISOString()
    };
  }
}
