const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Generate JWT token for user
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token and return user ID
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Extract user ID from Authorization header or request body
const getUserFromRequest = async (event) => {
  let userId = null;
  
  // Try to get from Authorization header first
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      userId = verifyToken(token);
    } catch (error) {
      throw new Error('Invalid authorization token');
    }
  }
  
  // Fallback to user_id in request body (for development/testing)
  if (!userId && event.body) {
    try {
      const body = JSON.parse(event.body);
      userId = body.user_id;
    } catch (error) {
      // Ignore parsing errors
    }
  }
  
  // Fallback to query parameter (for GET requests)
  if (!userId && event.queryStringParameters?.user_id) {
    userId = parseInt(event.queryStringParameters.user_id);
  }
  
  if (!userId) {
    throw new Error('Authentication required');
  }
  
  // Verify user exists in database
  const userResult = await db.query('SELECT id, email, name FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return {
    id: userId,
    email: userResult.rows[0].email,
    name: userResult.rows[0].name
  };
};

// Create or update user (for LinkedIn OAuth or manual creation)
const createOrUpdateUser = async (userData) => {
  const { linkedin_id, email, name, profile_url } = userData;
  
  if (!linkedin_id) {
    throw new Error('LinkedIn ID is required');
  }
  
  try {
    // Try to find existing user
    let userResult = await db.query(
      'SELECT id, email, name, profile_url FROM users WHERE linkedin_id = $1',
      [linkedin_id]
    );
    
    if (userResult.rows.length > 0) {
      // Update existing user
      const userId = userResult.rows[0].id;
      await db.query(
        'UPDATE users SET email = $1, name = $2, profile_url = $3 WHERE id = $4',
        [email, name, profile_url, userId]
      );
      
      return {
        id: userId,
        email: email || userResult.rows[0].email,
        name: name || userResult.rows[0].name,
        profile_url: profile_url || userResult.rows[0].profile_url,
        token: generateToken(userId)
      };
    } else {
      // Create new user
      const insertResult = await db.query(
        'INSERT INTO users (linkedin_id, email, name, profile_url) VALUES ($1, $2, $3, $4) RETURNING id',
        [linkedin_id, email, name, profile_url]
      );
      
      const userId = insertResult.rows[0].id;
      
      return {
        id: userId,
        email,
        name,
        profile_url,
        token: generateToken(userId)
      };
    }
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('Email address already in use');
    }
    throw error;
  }
};

// Create demo user (for development/testing)
const createDemoUser = async () => {
  const demoUserData = {
    linkedin_id: 'demo-user-' + Date.now(),
    email: 'demo@example.com',
    name: 'Demo User',
    profile_url: null
  };
  
  return await createOrUpdateUser(demoUserData);
};

module.exports = {
  generateToken,
  verifyToken,
  getUserFromRequest,
  createOrUpdateUser,
  createDemoUser
};