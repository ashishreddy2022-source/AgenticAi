/**
 * Recovery Agent
 * Classifies failure types and determines mitigation strategies:
 * - MISSING_FIELDS
 * - API_FAILURE
 * - AUTH_EXPIRED
 * - RATE_LIMIT
 * - TRANSIENT
 * Strategy decisions: 'retry_with_backoff' | 'escalate'
 */
export class RecoveryAgent {
  /**
   * Classifies an error and determines recovery strategy
   * @param {Error|Object} error 
   * @param {number} currentRetryCount 
   * @param {number} maxRetries 
   * @returns {{ classification: string, strategy: 'retry_with_backoff'|'escalate', backoffMs: number, reason: string }}
   */
  static analyzeFailure(error, currentRetryCount = 0, maxRetries = 3) {
    const errorMsg = (error.message || String(error)).toLowerCase();
    const errorCode = error.code || '';

    let classification = 'TRANSIENT';
    let strategy = 'retry_with_backoff';
    let backoffMs = 1000 * Math.pow(2, currentRetryCount); // Exponential backoff (1s, 2s, 4s...)

    // 1. Classification
    if (errorCode === 'INTEGRATION_NOT_CONNECTED' || errorCode === 'AUTH_EXPIRED' || errorMsg.includes('auth') || errorMsg.includes('unauthorized') || errorMsg.includes('token expired') || errorMsg.includes('401')) {
      classification = 'AUTH_EXPIRED';
      strategy = 'escalate'; // Cannot retry without user re-authenticating
    } else if (errorCode === 'MISSING_FIELDS' || errorMsg.includes('missing') || errorMsg.includes('required')) {
      classification = 'MISSING_FIELDS';
      strategy = 'escalate'; // Schema contract violation requires human operator fix
    } else if (errorCode === 'RATE_LIMIT' || errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('too many requests')) {
      classification = 'RATE_LIMIT';
      backoffMs = 5000 * (currentRetryCount + 1); // Generous delay for rate limits
      strategy = currentRetryCount < maxRetries ? 'retry_with_backoff' : 'escalate';
    } else if (errorCode === 'API_FAILURE' || errorMsg.includes('fetch') || errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503') || errorMsg.includes('network')) {
      classification = 'API_FAILURE';
      strategy = currentRetryCount < maxRetries ? 'retry_with_backoff' : 'escalate';
    } else {
      classification = 'TRANSIENT';
      strategy = currentRetryCount < maxRetries ? 'retry_with_backoff' : 'escalate';
    }

    return {
      classification,
      strategy,
      backoffMs,
      reason: `Classified as ${classification}. Strategy: ${strategy} (Attempt ${currentRetryCount}/${maxRetries})`
    };
  }
}
