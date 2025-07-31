const { getUserFromRequest } = require('../../utils/auth');
const { 
  storeEncryptedData, 
  retrieveEncryptedData,
  generateSecureToken,
  logSecurityEvent,
  getClientInfo
} = require('../../utils/security');
const db = require('../../utils/db');
const crypto = require('crypto');

exports.main = async (event) => {
  const { clientIp, userAgent } = getClientInfo(event);
  
  try {
    // Authenticate user
    const user = await getUserFromRequest(event);
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
    if (path.includes('/preferences')) {
      return await handlePreferences(user, httpMethod, event, headers);
    } else if (path.includes('/api-keys')) {
      return await handleApiKeys(user, httpMethod, event, headers, path);
    } else if (path.includes('/privacy')) {
      return await handlePrivacy(user, httpMethod, event, headers);
    } else if (path.includes('/delete-account')) {
      return await handleAccountDeletion(user, httpMethod, event, headers);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Settings management error:', error);
    
    if (error.message.includes('Authentication required') || error.message.includes('Invalid token')) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        body: JSON.stringify({ error: "Authentication required" }),
      };
    }
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
    };
  }
};

// Handle user preferences
async function handlePreferences(user, method, event, headers) {
  if (method === 'GET') {
    // Get user preferences
    const result = await db.query(
      'SELECT preferences FROM user_preferences WHERE user_id = $1',
      [user.id]
    );

    const preferences = result.rows.length > 0 
      ? result.rows[0].preferences 
      : getDefaultPreferences();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ preferences })
    };

  } else if (method === 'PUT') {
    // Update user preferences
    const body = JSON.parse(event.body);
    const { preferences } = body;

    if (!preferences) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Preferences data required' })
      };
    }

    // Upsert preferences
    await db.query(`
      INSERT INTO user_preferences (user_id, preferences, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET preferences = $2, updated_at = NOW()
    `, [user.id, JSON.stringify(preferences)]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preferences updated successfully' })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}

// Handle API keys
async function handleApiKeys(user, method, event, headers, path) {
  if (method === 'GET') {
    // Get user's API keys
    const result = await db.query(`
      SELECT id, name, key_preview, created_at, last_used, is_active
      FROM api_keys 
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `, [user.id]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        keys: result.rows.map(key => ({
          id: key.id,
          name: key.name,
          key_preview: key.key_preview,
          created_at: key.created_at,
          last_used: key.last_used
        }))
      })
    };

  } else if (method === 'POST') {
    // Create new API key
    const body = JSON.parse(event.body);
    const { name, scopes = ['read'], rateLimit = 1000 } = body;

    if (!name || name.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Key name is required' })
      };
    }

    // Validate scopes
    const validScopes = ['read', 'write', 'delete', 'admin'];
    const invalidScopes = scopes.filter(scope => !validScopes.includes(scope));
    if (invalidScopes.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Invalid scopes: ${invalidScopes.join(', ')}` })
      };
    }

    // Generate API key
    const apiKey = generateApiKey();
    const keyPreview = apiKey.substring(0, 8) + '...';

    try {
      // Start transaction
      const client = await db.pool.connect();
      await client.query('BEGIN');

      try {
        // Store encrypted API key
        const encryptedKeyId = await storeEncryptedData(user.id, 'api_key', {
          key: apiKey,
          created_at: new Date().toISOString(),
          created_by: user.id
        });

        // Create API key record
        const result = await client.query(`
          INSERT INTO api_keys (user_id, name, encrypted_key_id, key_preview, key_scope, rate_limit_per_hour, created_at, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), true)
          RETURNING id, name, key_preview, created_at, key_scope, rate_limit_per_hour
        `, [user.id, name.trim(), encryptedKeyId, keyPreview, JSON.stringify(scopes), rateLimit]);

        await client.query('COMMIT');
        
        const newKey = result.rows[0];

        // Log security event
        await logSecurityEvent(user.id, 'api_key_created', clientIp, userAgent, true, {
          key_id: newKey.id,
          name: newKey.name,
          scopes: scopes
        });

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            message: 'API key created successfully',
            key: {
              id: newKey.id,
              name: newKey.name,
              key_preview: newKey.key_preview,
              created_at: newKey.created_at,
              scopes: scopes,
              rate_limit_per_hour: newKey.rate_limit_per_hour,
              api_key: apiKey // Only returned once!
            }
          })
        };

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      await logSecurityEvent(user.id, 'api_key_creation_error', clientIp, userAgent, false, {
        error: error.message,
        name: name.trim()
      });
      throw error;
    }

  } else if (method === 'DELETE') {
    // Revoke API key
    const keyId = path.split('/').pop();
    
    if (!keyId || isNaN(keyId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid key ID' })
      };
    }

    try {
      const result = await db.query(`
        UPDATE api_keys 
        SET is_active = false, revoked_at = NOW()
        WHERE id = $1 AND user_id = $2 AND is_active = true
        RETURNING name
      `, [keyId, user.id]);

      if (result.rowCount === 0) {
        await logSecurityEvent(user.id, 'api_key_revoke_not_found', clientIp, userAgent, false, {
          key_id: keyId
        });
        
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'API key not found' })
        };
      }

      const revokedKey = result.rows[0];

      await logSecurityEvent(user.id, 'api_key_revoked', clientIp, userAgent, true, {
        key_id: keyId,
        name: revokedKey.name
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'API key revoked successfully' })
      };

    } catch (error) {
      await logSecurityEvent(user.id, 'api_key_revoke_error', clientIp, userAgent, false, {
        error: error.message,
        key_id: keyId
      });
      throw error;
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}

// Handle privacy settings
async function handlePrivacy(user, method, event, headers) {
  if (method === 'GET') {
    // Get privacy settings
    const result = await db.query(
      'SELECT privacy_settings FROM user_privacy WHERE user_id = $1',
      [user.id]
    );

    const privacySettings = result.rows.length > 0 
      ? result.rows[0].privacy_settings 
      : getDefaultPrivacySettings();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ privacy_settings: privacySettings })
    };

  } else if (method === 'PUT') {
    // Update privacy settings
    const body = JSON.parse(event.body);
    const { privacy_settings } = body;

    if (!privacy_settings) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Privacy settings data required' })
      };
    }

    // Validate privacy settings
    const validatedSettings = validatePrivacySettings(privacy_settings);

    // Upsert privacy settings
    await db.query(`
      INSERT INTO user_privacy (user_id, privacy_settings, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET privacy_settings = $2, updated_at = NOW()
    `, [user.id, JSON.stringify(validatedSettings)]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Privacy settings updated successfully' })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}

// Handle account deletion
async function handleAccountDeletion(user, method, event, headers) {
  if (method !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const body = JSON.parse(event.body);
  const { confirmation } = body;

  if (confirmation !== 'DELETE MY ACCOUNT') {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid confirmation text' })
    };
  }

  // Begin transaction for account deletion
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    // Delete user data in order (due to foreign key constraints)
    await client.query('DELETE FROM query_history WHERE user_id = $1', [user.id]);
    await client.query('DELETE FROM connections WHERE user_id = $1', [user.id]);
    await client.query('DELETE FROM api_keys WHERE user_id = $1', [user.id]);
    await client.query('DELETE FROM user_preferences WHERE user_id = $1', [user.id]);
    await client.query('DELETE FROM user_privacy WHERE user_id = $1', [user.id]);
    await client.query('DELETE FROM users WHERE id = $1', [user.id]);

    await client.query('COMMIT');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Account deleted successfully',
        deleted_at: new Date().toISOString()
      })
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Utility functions
function generateApiKey() {
  return 'pnit_' + generateSecureToken();
}

function getDefaultPreferences() {
  return {
    notifications: {
      email: true,
      browser: true,
      query_results: true,
      system_updates: false
    },
    privacy: {
      data_retention_days: 365,
      allow_analytics: true,
      share_usage_stats: false
    },
    interface: {
      theme: 'auto',
      language: 'en',
      timezone: 'UTC',
      items_per_page: 25
    }
  };
}

function getDefaultPrivacySettings() {
  return {
    data_processing_consent: true,
    marketing_consent: false,
    analytics_consent: true,
    third_party_sharing: false,
    data_retention_period: 365,
    automatic_deletion: true
  };
}

function validatePrivacySettings(settings) {
  const defaults = getDefaultPrivacySettings();
  const validated = { ...defaults };

  // Validate each setting
  if (typeof settings.data_processing_consent === 'boolean') {
    validated.data_processing_consent = settings.data_processing_consent;
  }
  
  if (typeof settings.marketing_consent === 'boolean') {
    validated.marketing_consent = settings.marketing_consent;
  }
  
  if (typeof settings.analytics_consent === 'boolean') {
    validated.analytics_consent = settings.analytics_consent;
  }
  
  if (typeof settings.third_party_sharing === 'boolean') {
    validated.third_party_sharing = settings.third_party_sharing;
  }
  
  if (typeof settings.data_retention_period === 'number' && 
      [30, 90, 180, 365, 730, -1].includes(settings.data_retention_period)) {
    validated.data_retention_period = settings.data_retention_period;
  }
  
  if (typeof settings.automatic_deletion === 'boolean') {
    validated.automatic_deletion = settings.automatic_deletion;
  }

  return validated;
}