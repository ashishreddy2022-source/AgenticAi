import crypto from 'crypto';
import { config } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from the configured encryption key string.
 */
function getKey() {
  const rawKey = config.encryptionKey || 'default_32_byte_key_agentflow_ai_encrypt!';
  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypts a plaintext string into a hex payload (iv:tag:ciphertext)
 * @param {string} text 
 * @returns {string} encrypted hex string
 */
export function encrypt(text) {
  if (!text) return text;
  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error.message);
    throw new Error('CREDENTIAL_ENCRYPTION_FAILED');
  }
}

/**
 * Decrypts a hex payload (iv:tag:ciphertext) into plaintext
 * @param {string} encryptedPayload 
 * @returns {string} decrypted plaintext string
 */
export function decrypt(encryptedPayload) {
  if (!encryptedPayload) return encryptedPayload;
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      // Return as is if not encrypted or in legacy format
      return encryptedPayload;
    }

    const [ivHex, tagHex, cipherText] = parts;
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    throw new Error('CREDENTIAL_DECRYPTION_FAILED');
  }
}
