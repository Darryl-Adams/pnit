const db = require('../../utils/db');

exports.main = async (event) => {
  try {
    const { user_id } = event.queryStringParameters || {};
    
    if (!user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing user_id query parameter." })
      };
    }

    // Get user information
    const userResult = await db.query(
      'SELECT id, email, name, profile_url, created_at FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found.' })
      };
    }

    // Get connection statistics
    const connectionStats = await db.query(
      `SELECT 
         COUNT(*) as total_connections,
         COUNT(DISTINCT company) as unique_companies,
         MAX(imported_at) as last_import
       FROM connections 
       WHERE user_id = $1`,
      [user_id]
    );

    // Get query statistics
    const queryStats = await db.query(
      `SELECT 
         COUNT(*) as total_queries,
         MAX(created_at) as last_query
       FROM query_history 
       WHERE user_id = $1`,
      [user_id]
    );

    const user = userResult.rows[0];
    const connStats = connectionStats.rows[0];
    const qStats = queryStats.rows[0];

    return {
      statusCode: 200,
      body: JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profile_url: user.profile_url,
          created_at: user.created_at
        },
        statistics: {
          total_connections: parseInt(connStats.total_connections),
          unique_companies: parseInt(connStats.unique_companies),
          last_import: connStats.last_import,
          total_queries: parseInt(qStats.total_queries),
          last_query: qStats.last_query
        }
      })
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};