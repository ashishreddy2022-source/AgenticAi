import { BaseIntegration } from './baseIntegration.js';
import { config } from '../config/env.js';

export class GmailIntegration extends BaseIntegration {
  constructor() {
    super('gmail');
  }

  getAuthUrl(state) {
    const { clientId, redirectUri } = config.oauth.gmail;
    if (!clientId) {
      return `/integrations?mock=gmail&state=${state}`;
    }
    const scopes = encodeURIComponent('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly');
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent&state=${state}`;
  }

  async handleCallback(code) {
    const { clientId, clientSecret, redirectUri } = config.oauth.gmail;
    if (!clientId || !clientSecret) {
      // Mock sandbox callback
      return {
        accessToken: `mock_gmail_token_${Date.now()}`,
        refreshToken: `mock_gmail_refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        accountEmail: 'operator@agentflow.ai',
        accountName: 'Agentflow Operator'
      };
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to exchange Gmail authorization code');
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      accountEmail: 'google_user@gmail.com'
    };
  }

  async testConnection(credentials) {
    if (!credentials || !credentials.accessToken) {
      return { valid: false, error: 'INTEGRATION_NOT_CONNECTED' };
    }
    if (credentials.accessToken.startsWith('mock_')) {
      return { valid: true, email: 'operator@agentflow.ai (Sandbox)' };
    }
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` }
      });
      if (res.status === 401) {
        return { valid: false, error: 'AUTH_EXPIRED' };
      }
      const data = await res.json();
      return { valid: res.ok, email: data.emailAddress, messagesTotal: data.messagesTotal };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  async executeAction(actionName, params, credentials) {
    if (!credentials || !credentials.accessToken) {
      const err = new Error('Gmail integration is not connected');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    // Check expiration
    if (credentials.expiresAt && new Date(credentials.expiresAt) < new Date() && !credentials.accessToken.startsWith('mock_')) {
      const err = new Error('Gmail authentication token has expired');
      err.code = 'AUTH_EXPIRED';
      throw err;
    }

    if (actionName === 'send_email' || actionName === 'sendMail') {
      const { to, subject, body, cc } = params;
      if (!to || !subject) {
        const err = new Error('Recipient (to) and subject are required for sending email');
        err.code = 'MISSING_FIELDS';
        throw err;
      }

      if (credentials.accessToken.startsWith('mock_')) {
        return {
          status: 'success',
          provider: 'gmail',
          messageId: `msg_${Date.now()}_mock`,
          to,
          subject,
          snippet: body ? body.substring(0, 100) : '',
          sentAt: new Date().toISOString(),
          mode: 'sandbox'
        };
      }

      // Real Gmail API call
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `To: ${to}`,
        cc ? `Cc: ${cc}` : '',
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        body || ''
      ].filter(Boolean);
      const rawMessage = Buffer.from(messageParts.join('\r\n')).toString('base64url');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: rawMessage })
      });

      if (!response.ok) {
        const errData = await response.json();
        const err = new Error(errData.error?.message || 'Failed to send Gmail message');
        err.code = response.status === 401 ? 'AUTH_EXPIRED' : 'API_FAILURE';
        throw err;
      }

      const resData = await response.json();
      return {
        status: 'success',
        provider: 'gmail',
        messageId: resData.id,
        threadId: resData.threadId,
        to,
        subject,
        sentAt: new Date().toISOString()
      };
    }

    if (actionName === 'read_emails' || actionName === 'searchMail') {
      const { query = '', maxResults = 5 } = params;
      if (credentials.accessToken.startsWith('mock_')) {
        return {
          status: 'success',
          provider: 'gmail',
          messages: [
            { id: 'mock_1', subject: 'Invoice #1042 for Review', from: 'billing@vendor.com', snippet: 'Please review attached invoice for $1,250' },
            { id: 'mock_2', subject: 'System Alert: High CPU', from: 'alerts@ops.io', snippet: 'Node 4 memory threshold exceeded 85%' }
          ],
          total: 2,
          mode: 'sandbox'
        };
      }

      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${credentials.accessToken}` }
      });
      if (!response.ok) {
        const err = new Error('Failed to fetch emails');
        err.code = response.status === 401 ? 'AUTH_EXPIRED' : 'API_FAILURE';
        throw err;
      }
      const data = await response.json();
      return {
        status: 'success',
        provider: 'gmail',
        messages: data.messages || [],
        resultSizeEstimate: data.resultSizeEstimate
      };
    }

    throw new Error(`Unsupported Gmail action: ${actionName}`);
  }
}
