const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('./db');

// Security configuration
const BCRYPT_ROUNDS = 12;
const TOKEN_LENGTH = 32;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_DERIVATION_ITERATIONS = 100000;

// Rate limiting configuration
const RATE_LIMITS = {
  login: { requests: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  register: { requests: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
  api: { requests: 100, window: 60 * 60 * 1000 }, // 100 requests per hour
  password_reset: { requests: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
};

const ACCOUNT_LOCKOUT = {
  threshold: 5, // Lock account after 5 failed attempts
  duration: 30 * 60 * 1000, // Lock for 30 minutes
};

// Encryption utilities
class EncryptionManager {
  constructor() {
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY || this.generateKey();
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      console.warn('WARNING: Using generated encryption key. Set ENCRYPTION_MASTER_KEY in production.');
    }
  }

  generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, KEY_DERIVATION_ITERATIONS, 32, 'sha256');
  }

  encrypt(data) {
    const salt = crypto.randomBytes(16);
    const key = this.deriveKey(this.masterKey, salt);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, key);
    cipher.setAAD(salt); // Additional authenticated data
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      keyId: crypto.createHash('sha256').update(this.masterKey).digest('hex').substring(0, 16)
    };
  }

  decrypt(encryptedData) {
    const { encrypted, salt, iv, authTag, keyId } = encryptedData;
    
    // Verify key ID
    const currentKeyId = crypto.createHash('sha256').update(this.masterKey).digest('hex').substring(0, 16);
    if (keyId !== currentKeyId) {
      throw new Error('Encryption key mismatch');
    }
    
    const key = this.deriveKey(this.masterKey, Buffer.from(salt, 'base64'));
    
    const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, key);
    decipher.setAAD(Buffer.from(salt, 'base64'));
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}

const encryptionManager = new EncryptionManager();

// Password utilities
const hashPassword = async (password) => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const generateSecureToken = () => {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
};

// Rate limiting
const checkRateLimit = async (identifier, endpoint, clientIp) => {
  const limit = RATE_LIMITS[endpoint];
  if (!limit) return true; // No limit configured

  const now = new Date();
  const windowStart = new Date(now.getTime() - limit.window);

  try {
    // Check current rate limit status
    const result = await db.query(`
      SELECT requests_count, window_start, blocked_until
      FROM rate_limits
      WHERE identifier = $1 AND endpoint = $2
      ORDER BY created_at DESC
      LIMIT 1
    `, [identifier, endpoint]);

    if (result.rows.length > 0) {
      const { requests_count, window_start, blocked_until } = result.rows[0];

      // Check if currently blocked
      if (blocked_until && new Date(blocked_until) > now) {
        return false;
      }

      // Check if within current window
      if (new Date(window_start) > windowStart) {
        if (requests_count >= limit.requests) {
          // Block for window duration
          await db.query(`
            UPDATE rate_limits
            SET blocked_until = $1
            WHERE identifier = $2 AND endpoint = $3
          `, [new Date(now.getTime() + limit.window), identifier, endpoint]);
          
          // Log security event
          await logSecurityEvent(null, 'rate_limit_exceeded', clientIp, null, false, {
            endpoint,
            identifier,
            requests_count
          });
          
          return false;
        }

        // Increment counter
        await db.query(`
          UPDATE rate_limits
          SET requests_count = requests_count + 1, updated_at = NOW()
          WHERE identifier = $1 AND endpoint = $2
        `, [identifier, endpoint]);
      } else {
        // New window, reset counter
        await db.query(`
          UPDATE rate_limits
          SET requests_count = 1, window_start = NOW(), blocked_until = NULL, updated_at = NOW()
          WHERE identifier = $1 AND endpoint = $2
        `, [identifier, endpoint]);
      }
    } else {
      // First request
      await db.query(`
        INSERT INTO rate_limits (identifier, endpoint, requests_count, window_start)
        VALUES ($1, $2, 1, NOW())
      `, [identifier, endpoint]);
    }

    return true;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return true; // Allow request on error to avoid blocking legitimate users
  }
};

// Security audit logging
const logSecurityEvent = async (userId, eventType, ipAddress, userAgent, success, details = {}) => {
  try {
    await db.query(`
      INSERT INTO security_audit_log (user_id, event_type, ip_address, user_agent, success, details)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, eventType, ipAddress, userAgent, success, JSON.stringify(details)]);
  } catch (error) {
    console.error('Security logging error:', error);
  }
};

// Account lockout management
const checkAccountLockout = async (userId) => {
  try {
    const result = await db.query(
      'SELECT failed_login_attempts, locked_until FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) return false;

    const { failed_login_attempts, locked_until } = result.rows[0];
    
    if (locked_until && new Date(locked_until) > new Date()) {
      return true; // Account is locked
    }

    if (locked_until && new Date(locked_until) <= new Date()) {
      // Unlock expired lockout
      await db.query(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
        [userId]
      );
    }

    return false;
  } catch (error) {
    console.error('Account lockout check error:', error);
    return false;
  }
};

const handleFailedLogin = async (userId, ipAddress, userAgent) => {
  try {
    const result = await db.query(`
      UPDATE users 
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE 
            WHEN failed_login_attempts + 1 >= $1 THEN NOW() + INTERVAL '${ACCOUNT_LOCKOUT.duration} milliseconds'
            ELSE locked_until
          END
      WHERE id = $2
      RETURNING failed_login_attempts, locked_until
    `, [ACCOUNT_LOCKOUT.threshold, userId]);

    const { failed_login_attempts, locked_until } = result.rows[0];

    await logSecurityEvent(userId, 'failed_login', ipAddress, userAgent, false, {
      attempts: failed_login_attempts,
      locked: !!locked_until
    });

    return {
      attempts: failed_login_attempts,
      locked: !!locked_until,
      lockoutExpires: locked_until
    };
  } catch (error) {
    console.error('Failed login handling error:', error);
    return { attempts: 0, locked: false };
  }
};

const handleSuccessfulLogin = async (userId, ipAddress, userAgent) => {
  try {
    await db.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1',
      [userId]
    );

    await logSecurityEvent(userId, 'login', ipAddress, userAgent, true);
  } catch (error) {
    console.error('Successful login handling error:', error);
  }
};

// Encrypted data storage
const storeEncryptedData = async (userId, dataType, data) => {
  try {
    const encryptedData = encryptionManager.encrypt(data);
    
    const result = await db.query(`
      INSERT INTO encrypted_data (user_id, data_type, encrypted_data, encryption_key_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      userId,
      dataType,
      JSON.stringify(encryptedData),
      encryptedData.keyId
    ]);

    return result.rows[0].id;
  } catch (error) {
    console.error('Encrypted data storage error:', error);
    throw new Error('Failed to store encrypted data');
  }
};

const retrieveEncryptedData = async (userId, dataType, encryptedDataId = null) => {
  try {
    let query, params;
    
    if (encryptedDataId) {
      query = `
        SELECT encrypted_data, encryption_key_id
        FROM encrypted_data
        WHERE id = $1 AND user_id = $2
      `;
      params = [encryptedDataId, userId];
    } else {
      query = `
        SELECT encrypted_data, encryption_key_id
        FROM encrypted_data
        WHERE user_id = $1 AND data_type = $2
        ORDER BY created_at DESC
        LIMIT 1
      `;
      params = [userId, dataType];
    }

    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return null;
    }

    const encryptedData = JSON.parse(result.rows[0].encrypted_data);
    return encryptionManager.decrypt(encryptedData);
  } catch (error) {
    console.error('Encrypted data retrieval error:', error);
    throw new Error('Failed to retrieve encrypted data');
  }
};

// Session management
const createSession = async (userId, deviceInfo, ipAddress, userAgent) => {
  try {
    const sessionToken = generateSecureToken();
    const refreshToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const result = await db.query(`
      INSERT INTO user_sessions (user_id, session_token, refresh_token, device_info, ip_address, user_agent, expires_at, refresh_expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [userId, sessionToken, refreshToken, JSON.stringify(deviceInfo), ipAddress, userAgent, expiresAt, refreshExpiresAt]);

    return {
      sessionId: result.rows[0].id,
      sessionToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt
    };
  } catch (error) {
    console.error('Session creation error:', error);
    throw new Error('Failed to create session');
  }
};

const validateSession = async (sessionToken) => {
  try {
    const result = await db.query(`
      SELECT s.id, s.user_id, s.expires_at, s.refresh_expires_at, u.email, u.name
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = $1 AND s.is_active = true AND s.expires_at > NOW()
    `, [sessionToken]);

    if (result.rows.length === 0) {
      return null;
    }

    // Update last used timestamp
    await db.query(
      'UPDATE user_sessions SET last_used = NOW() WHERE id = $1',
      [result.rows[0].id]
    );

    return {
      sessionId: result.rows[0].id,
      userId: result.rows[0].user_id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      expiresAt: result.rows[0].expires_at,
      refreshExpiresAt: result.rows[0].refresh_expires_at
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
};

const refreshSession = async (refreshToken) => {
  try {
    const result = await db.query(`
      SELECT id, user_id, refresh_expires_at
      FROM user_sessions
      WHERE refresh_token = $1 AND is_active = true AND refresh_expires_at > NOW()
    `, [refreshToken]);

    if (result.rows.length === 0) {
      return null;
    }

    const { id: sessionId, user_id: userId } = result.rows[0];
    
    // Generate new tokens
    const newSessionToken = generateSecureToken();
    const newRefreshToken = generateSecureToken();
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const newRefreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.query(`
      UPDATE user_sessions
      SET session_token = $1, refresh_token = $2, expires_at = $3, refresh_expires_at = $4, last_used = NOW()
      WHERE id = $5
    `, [newSessionToken, newRefreshToken, newExpiresAt, newRefreshExpiresAt, sessionId]);

    return {
      sessionId,
      userId,
      sessionToken: newSessionToken,
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
      refreshExpiresAt: newRefreshExpiresAt
    };
  } catch (error) {
    console.error('Session refresh error:', error);
    return null;
  }
};

const revokeSession = async (sessionToken) => {
  try {
    await db.query(
      'UPDATE user_sessions SET is_active = false WHERE session_token = $1',
      [sessionToken]
    );
    return true;
  } catch (error) {
    console.error('Session revocation error:', error);
    return false;
  }
};

const revokeAllUserSessions = async (userId) => {
  try {
    await db.query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
      [userId]
    );
    return true;
  } catch (error) {
    console.error('User session revocation error:', error);
    return false;
  }
};

// Input validation and sanitization
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Minimum 8 characters, at least one uppercase, one lowercase, one number, one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

// Extract client information from request
const getClientInfo = (event) => {
  const headers = event.headers || {};
  const clientIp = 
    headers['x-forwarded-for'] ||
    headers['x-real-ip'] ||
    event.requestContext?.identity?.sourceIp ||
    '127.0.0.1';
    
  const userAgent = headers['user-agent'] || 'Unknown';
  
  return { clientIp, userAgent };
};

module.exports = {
  // Password utilities
  hashPassword,
  verifyPassword,
  generateSecureToken,
  
  // Rate limiting
  checkRateLimit,
  
  // Security logging
  logSecurityEvent,
  
  // Account management
  checkAccountLockout,
  handleFailedLogin,
  handleSuccessfulLogin,
  
  // Encryption
  storeEncryptedData,
  retrieveEncryptedData,
  encryptionManager,
  
  // Session management
  createSession,
  validateSession,
  refreshSession,
  revokeSession,
  revokeAllUserSessions,
  
  // Validation
  validateEmail,
  validatePassword,
  sanitizeInput,
  
  // Utilities
  getClientInfo,
  
  // Constants
  RATE_LIMITS,
  ACCOUNT_LOCKOUT
};