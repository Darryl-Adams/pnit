const { createDemoUser, createOrUpdateUser, generateToken } = require('../../utils/auth');
const { 
  hashPassword, 
  verifyPassword, 
  generateSecureToken,
  checkRateLimit,
  logSecurityEvent,
  checkAccountLockout,
  handleFailedLogin,
  handleSuccessfulLogin,
  createSession,
  validateSession,
  refreshSession,
  revokeSession,
  revokeAllUserSessions,
  validateEmail,
  validatePassword,
  sanitizeInput,
  getClientInfo
} = require('../../utils/security');
const db = require('../../utils/db');

exports.main = async (event) => {
  const { clientIp, userAgent } = getClientInfo(event);
  
  try {
    const { httpMethod, path } = event;
    
    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        body: '',
      };
    }

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Content-Type': 'application/json'
    };

    // Route handling
    if (httpMethod === 'POST' && path.includes('/register')) {
      return await handleRegister(event, clientIp, userAgent, headers);
    } else if (httpMethod === 'POST' && path.includes('/login')) {
      return await handleLogin(event, clientIp, userAgent, headers);
    } else if (httpMethod === 'POST' && path.includes('/refresh')) {
      return await handleRefresh(event, clientIp, userAgent, headers);
    } else if (httpMethod === 'POST' && path.includes('/logout')) {
      return await handleLogout(event, clientIp, userAgent, headers);
    } else if (httpMethod === 'POST' && path.includes('/logout-all')) {
      return await handleLogoutAll(event, clientIp, userAgent, headers);
    } else if (httpMethod === 'POST' && path.includes('/forgot-password')) {
      return await handleForgotPassword(event, clientIp, userAgent, headers);
    } else if (httpMethod === 'POST' && path.includes('/reset-password')) {
      return await handleResetPassword(event, clientIp, userAgent, headers);
    } else if (httpMethod === 'POST' && path.includes('/change-password')) {
      return await handleChangePassword(event, clientIp, userAgent, headers);
    } else if (httpMethod === 'POST' && path.includes('/demo')) {
      return await handleDemo(event, clientIp, userAgent, headers);
    } else if (httpMethod === 'POST' && path.includes('/user')) {
      return await handleLinkedInAuth(event, clientIp, userAgent, headers);
    } else if (httpMethod === 'GET' && path.includes('/me')) {
      return await handleGetProfile(event, clientIp, userAgent, headers);
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
    
  } catch (error) {
    console.error('Auth error:', error);
    
    await logSecurityEvent(null, 'auth_error', clientIp, userAgent, false, {
      error: error.message,
      path: event.path
    });
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({ 
        error: 'Authentication failed', 
        details: error.message 
      }),
    };
  }
};

// Handle user registration
async function handleRegister(event, clientIp, userAgent, headers) {
  // Check rate limit
  if (!await checkRateLimit(clientIp, 'register', clientIp)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: 'Too many registration attempts. Please try again later.' })
    };
  }

  const body = JSON.parse(event.body);
  const { email, password, name } = body;

  // Validate input
  if (!email || !password || !name) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Email, password, and name are required' })
    };
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const sanitizedName = sanitizeInput(name);

  if (!validateEmail(sanitizedEmail)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid email format' })
    };
  }

  if (!validatePassword(password)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
      })
    };
  }

  try {
    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [sanitizedEmail]);
    if (existingUser.rows.length > 0) {
      await logSecurityEvent(null, 'registration_duplicate_email', clientIp, userAgent, false, {
        email: sanitizedEmail
      });
      
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Email already registered' })
      };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await db.query(`
      INSERT INTO users (email, password_hash, name, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, email, name, created_at
    `, [sanitizedEmail, passwordHash, sanitizedName]);

    const user = result.rows[0];

    // Create session
    const deviceInfo = { type: 'web', userAgent };
    const session = await createSession(user.id, deviceInfo, clientIp, userAgent);

    await logSecurityEvent(user.id, 'registration', clientIp, userAgent, true, {
      email: sanitizedEmail
    });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at
        },
        session: {
          token: session.sessionToken,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt
        }
      })
    };

  } catch (error) {
    await logSecurityEvent(null, 'registration_error', clientIp, userAgent, false, {
      error: error.message,
      email: sanitizedEmail
    });
    throw error;
  }
}

// Handle user login
async function handleLogin(event, clientIp, userAgent, headers) {
  // Check rate limit
  if (!await checkRateLimit(clientIp, 'login', clientIp)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: 'Too many login attempts. Please try again later.' })
    };
  }

  const body = JSON.parse(event.body);
  const { email, password } = body;

  if (!email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Email and password are required' })
    };
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());

  try {
    // Get user
    const result = await db.query(`
      SELECT id, email, name, password_hash, failed_login_attempts, locked_until
      FROM users 
      WHERE email = $1
    `, [sanitizedEmail]);

    if (result.rows.length === 0) {
      await logSecurityEvent(null, 'login_invalid_email', clientIp, userAgent, false, {
        email: sanitizedEmail
      });
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid email or password' })
      };
    }

    const user = result.rows[0];

    // Check account lockout
    if (await checkAccountLockout(user.id)) {
      await logSecurityEvent(user.id, 'login_account_locked', clientIp, userAgent, false);
      
      return {
        statusCode: 423,
        headers,
        body: JSON.stringify({ 
          error: 'Account temporarily locked due to too many failed login attempts' 
        })
      };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      const lockoutInfo = await handleFailedLogin(user.id, clientIp, userAgent);
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid email or password',
          attemptsRemaining: Math.max(0, 5 - lockoutInfo.attempts)
        })
      };
    }

    // Successful login
    await handleSuccessfulLogin(user.id, clientIp, userAgent);

    // Create session
    const deviceInfo = { type: 'web', userAgent };
    const session = await createSession(user.id, deviceInfo, clientIp, userAgent);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        session: {
          token: session.sessionToken,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt
        }
      })
    };

  } catch (error) {
    await logSecurityEvent(null, 'login_error', clientIp, userAgent, false, {
      error: error.message,
      email: sanitizedEmail
    });
    throw error;
  }
}

// Handle session refresh
async function handleRefresh(event, clientIp, userAgent, headers) {
  const body = JSON.parse(event.body);
  const { refreshToken } = body;

  if (!refreshToken) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Refresh token required' })
    };
  }

  try {
    const newSession = await refreshSession(refreshToken);

    if (!newSession) {
      await logSecurityEvent(null, 'session_refresh_invalid', clientIp, userAgent, false);
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired refresh token' })
      };
    }

    await logSecurityEvent(newSession.userId, 'session_refresh', clientIp, userAgent, true);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Session refreshed successfully',
        session: {
          token: newSession.sessionToken,
          refreshToken: newSession.refreshToken,
          expiresAt: newSession.expiresAt
        }
      })
    };

  } catch (error) {
    await logSecurityEvent(null, 'session_refresh_error', clientIp, userAgent, false, {
      error: error.message
    });
    throw error;
  }
}

// Handle logout
async function handleLogout(event, clientIp, userAgent, headers) {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Session token required' })
    };
  }

  const sessionToken = authHeader.substring(7);

  try {
    const session = await validateSession(sessionToken);
    await revokeSession(sessionToken);

    if (session) {
      await logSecurityEvent(session.userId, 'logout', clientIp, userAgent, true);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Logged out successfully' })
    };

  } catch (error) {
    await logSecurityEvent(null, 'logout_error', clientIp, userAgent, false, {
      error: error.message
    });
    throw error;
  }
}

// Handle logout from all devices
async function handleLogoutAll(event, clientIp, userAgent, headers) {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Session token required' })
    };
  }

  const sessionToken = authHeader.substring(7);

  try {
    const session = await validateSession(sessionToken);
    
    if (!session) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid session' })
      };
    }

    await revokeAllUserSessions(session.userId);
    await logSecurityEvent(session.userId, 'logout_all', clientIp, userAgent, true);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Logged out from all devices successfully' })
    };

  } catch (error) {
    await logSecurityEvent(null, 'logout_all_error', clientIp, userAgent, false, {
      error: error.message
    });
    throw error;
  }
}

// Handle forgot password
async function handleForgotPassword(event, clientIp, userAgent, headers) {
  // Check rate limit
  if (!await checkRateLimit(clientIp, 'password_reset', clientIp)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: 'Too many password reset attempts. Please try again later.' })
    };
  }

  const body = JSON.parse(event.body);
  const { email } = body;

  if (!email) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Email is required' })
    };
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());

  try {
    const result = await db.query('SELECT id FROM users WHERE email = $1', [sanitizedEmail]);

    // Always return success to prevent email enumeration
    if (result.rows.length > 0) {
      const userId = result.rows[0].id;
      const resetToken = generateSecureToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.query(`
        UPDATE users 
        SET password_reset_token = $1, password_reset_expires = $2
        WHERE id = $3
      `, [resetToken, resetExpires, userId]);

      await logSecurityEvent(userId, 'password_reset_request', clientIp, userAgent, true);

      // In a real application, send email here
      console.log(`Password reset token for ${sanitizedEmail}: ${resetToken}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'If the email exists, a password reset link has been sent' 
      })
    };

  } catch (error) {
    await logSecurityEvent(null, 'password_reset_error', clientIp, userAgent, false, {
      error: error.message,
      email: sanitizedEmail
    });
    throw error;
  }
}

// Handle reset password
async function handleResetPassword(event, clientIp, userAgent, headers) {
  const body = JSON.parse(event.body);
  const { token, newPassword } = body;

  if (!token || !newPassword) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Token and new password are required' })
    };
  }

  if (!validatePassword(newPassword)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
      })
    };
  }

  try {
    const result = await db.query(`
      SELECT id, email FROM users 
      WHERE password_reset_token = $1 AND password_reset_expires > NOW()
    `, [token]);

    if (result.rows.length === 0) {
      await logSecurityEvent(null, 'password_reset_invalid_token', clientIp, userAgent, false);
      
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired reset token' })
      };
    }

    const user = result.rows[0];
    const passwordHash = await hashPassword(newPassword);

    await db.query(`
      UPDATE users 
      SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL,
          failed_login_attempts = 0, locked_until = NULL
      WHERE id = $2
    `, [passwordHash, user.id]);

    // Revoke all existing sessions
    await revokeAllUserSessions(user.id);

    await logSecurityEvent(user.id, 'password_reset_success', clientIp, userAgent, true);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Password reset successfully' })
    };

  } catch (error) {
    await logSecurityEvent(null, 'password_reset_error', clientIp, userAgent, false, {
      error: error.message
    });
    throw error;
  }
}

// Handle change password
async function handleChangePassword(event, clientIp, userAgent, headers) {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Authentication required' })
    };
  }

  const sessionToken = authHeader.substring(7);
  const session = await validateSession(sessionToken);

  if (!session) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid session' })
    };
  }

  const body = JSON.parse(event.body);
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Current password and new password are required' })
    };
  }

  if (!validatePassword(newPassword)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
      })
    };
  }

  try {
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [session.userId]);
    const user = result.rows[0];

    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);

    if (!isValidPassword) {
      await logSecurityEvent(session.userId, 'password_change_invalid', clientIp, userAgent, false);
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Current password is incorrect' })
      };
    }

    const passwordHash = await hashPassword(newPassword);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, session.userId]);

    // Revoke all other sessions
    await revokeAllUserSessions(session.userId);

    await logSecurityEvent(session.userId, 'password_change_success', clientIp, userAgent, true);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Password changed successfully' })
    };

  } catch (error) {
    await logSecurityEvent(session.userId, 'password_change_error', clientIp, userAgent, false, {
      error: error.message
    });
    throw error;
  }
}

// Handle get user profile
async function handleGetProfile(event, clientIp, userAgent, headers) {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Authentication required' })
    };
  }

  const sessionToken = authHeader.substring(7);
  const session = await validateSession(sessionToken);

  if (!session) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid session' })
    };
  }

  try {
    const result = await db.query(`
      SELECT id, email, name, profile_url, created_at, last_login, email_verified, two_factor_enabled
      FROM users 
      WHERE id = $1
    `, [session.userId]);

    const user = result.rows[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileUrl: user.profile_url,
          createdAt: user.created_at,
          lastLogin: user.last_login,
          emailVerified: user.email_verified,
          twoFactorEnabled: user.two_factor_enabled
        }
      })
    };

  } catch (error) {
    await logSecurityEvent(session.userId, 'profile_fetch_error', clientIp, userAgent, false, {
      error: error.message
    });
    throw error;
  }
}

// Handle demo user creation (development only)
async function handleDemo(event, clientIp, userAgent, headers) {
  if (process.env.NODE_ENV === 'production') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Demo users not available in production' })
    };
  }

  try {
    const user = await createDemoUser();
    
    await logSecurityEvent(user.id, 'demo_user_created', clientIp, userAgent, true);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Demo user created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token: user.token
      }),
    };
  } catch (error) {
    await logSecurityEvent(null, 'demo_user_error', clientIp, userAgent, false, {
      error: error.message
    });
    throw error;
  }
}

// Handle LinkedIn OAuth (existing functionality)
async function handleLinkedInAuth(event, clientIp, userAgent, headers) {
  const body = JSON.parse(event.body);
  const { linkedin_id, email, name, profile_url } = body;
  
  if (!linkedin_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'LinkedIn ID is required' }),
    };
  }
  
  try {
    const user = await createOrUpdateUser({
      linkedin_id,
      email,
      name,
      profile_url
    });
    
    await logSecurityEvent(user.id, 'linkedin_auth', clientIp, userAgent, true);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'User authenticated successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profile_url: user.profile_url
        },
        token: user.token
      }),
    };
  } catch (error) {
    await logSecurityEvent(null, 'linkedin_auth_error', clientIp, userAgent, false, {
      error: error.message,
      linkedin_id
    });
    throw error;
  }
}