import { BaseIntegration } from './baseIntegration.js';
import { config } from '../config/env.js';

export class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
  }

  getAuthUrl(state) {
    const { clientId, redirectUri } = config.oauth.googleSheets;
    if (!clientId) {
      return `/integrations?mock=google-sheets&state=${state}`;
    }
    const scopes = encodeURIComponent('https://www.googleapis.com/auth/spreadsheets');
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent&state=${state}`;
  }

  async handleCallback(code) {
    const { clientId, clientSecret, redirectUri } = config.oauth.googleSheets;
    if (!clientId || !clientSecret) {
      return {
        accessToken: `mock_sheets_token_${Date.now()}`,
        refreshToken: `mock_sheets_refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        accountEmail: 'sheets_operator@agentflow.ai'
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
      throw new Error(data.error_description || 'Failed to exchange Google Sheets authorization code');
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
      return { valid: true, sheetService: 'Active (Sandbox Mode)' };
    }
    try {
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets/SAMPLE', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` }
      });
      // 404 is expected for dummy id if auth token is valid, 401 is invalid
      if (res.status === 401) {
        return { valid: false, error: 'AUTH_EXPIRED' };
      }
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  async executeAction(actionName, params, credentials) {
    if (!credentials || !credentials.accessToken) {
      const err = new Error('Google Sheets integration is not connected');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (credentials.expiresAt && new Date(credentials.expiresAt) < new Date() && !credentials.accessToken.startsWith('mock_')) {
      const err = new Error('Google Sheets token expired');
      err.code = 'AUTH_EXPIRED';
      throw err;
    }

    const { spreadsheetId, range = 'Sheet1!A1', values, row } = params;

    if (actionName === 'append_row' || actionName === 'appendRow') {
      const rowData = values || (Array.isArray(row) ? [row] : [[row || 'Sample Row']]);

      if (credentials.accessToken.startsWith('mock_')) {
        return {
          status: 'success',
          provider: 'google-sheets',
          spreadsheetId: spreadsheetId || 'mock_spreadsheet_id_101',
          updatedRange: `${range.split('!')[0] || 'Sheet1'}!A${Math.floor(Math.random() * 50) + 1}:D${Math.floor(Math.random() * 50) + 1}`,
          updatedRows: rowData.length,
          updatedColumns: Array.isArray(rowData[0]) ? rowData[0].length : 1,
          appendedAt: new Date().toISOString(),
          mode: 'sandbox'
        };
      }

      if (!spreadsheetId) {
        const err = new Error('spreadsheetId is required for Google Sheets append');
        err.code = 'MISSING_FIELDS';
        throw err;
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: rowData })
      });

      if (!response.ok) {
        const errData = await response.json();
        const err = new Error(errData.error?.message || 'Failed to append to Google Sheets');
        err.code = response.status === 401 ? 'AUTH_EXPIRED' : 'API_FAILURE';
        throw err;
      }

      const data = await response.json();
      return {
        status: 'success',
        provider: 'google-sheets',
        spreadsheetId,
        updates: data.updates,
        appendedAt: new Date().toISOString()
      };
    }

    if (actionName === 'read_range' || actionName === 'readRange') {
      if (credentials.accessToken.startsWith('mock_')) {
        return {
          status: 'success',
          provider: 'google-sheets',
          range,
          values: [
            ['ID', 'Customer', 'Amount', 'Status'],
            ['INV-101', 'Acme Corp', '$4,500', 'Paid'],
            ['INV-102', 'Globex Inc', '$1,200', 'Pending']
          ],
          mode: 'sandbox'
        };
      }

      if (!spreadsheetId) {
        const err = new Error('spreadsheetId is required');
        err.code = 'MISSING_FIELDS';
        throw err;
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${credentials.accessToken}` }
      });
      if (!response.ok) {
        const err = new Error('Failed to read Google Sheets range');
        err.code = response.status === 401 ? 'AUTH_EXPIRED' : 'API_FAILURE';
        throw err;
      }

      const data = await response.json();
      return {
        status: 'success',
        provider: 'google-sheets',
        range: data.range,
        values: data.values || []
      };
    }

    throw new Error(`Unsupported Google Sheets action: ${actionName}`);
  }
}
