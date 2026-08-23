/**
 * Base Integration Class defining the standard interface for all third-party integrations.
 */
export class BaseIntegration {
  constructor(providerName) {
    if (!providerName) {
      throw new Error('Provider name is required for BaseIntegration');
    }
    this.provider = providerName;
  }

  /**
   * Generates the OAuth authorization URL
   * @param {string} state - Random state string or redirect state
   * @returns {string} authorization URL
   */
  getAuthUrl(state) {
    throw new Error(`getAuthUrl not implemented for provider: ${this.provider}`);
  }

  /**
   * Exchanges authorization code for tokens
   * @param {string} code - Authorization code from callback
   * @returns {Promise<{accessToken: string, refreshToken?: string, expiresAt?: Date, accountInfo?: any}>}
   */
  async handleCallback(code) {
    throw new Error(`handleCallback not implemented for provider: ${this.provider}`);
  }

  /**
   * Tests whether the credentials are currently valid
   * @param {Object} credentials - Decrypted credentials object
   * @returns {Promise<{valid: boolean, details?: any}>}
   */
  async testConnection(credentials) {
    throw new Error(`testConnection not implemented for provider: ${this.provider}`);
  }

  /**
   * Executes an action on this integration
   * @param {string} actionName - Name of the action (e.g., 'send_email', 'post_message')
   * @param {Object} params - Action parameters
   * @param {Object} credentials - Decrypted integration credentials
   * @returns {Promise<any>}
   */
  async executeAction(actionName, params, credentials) {
    throw new Error(`executeAction not implemented for provider: ${this.provider}`);
  }
}
