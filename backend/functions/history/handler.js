const { getUserFromRequest } = require('../../utils/auth');
const db = require('../../utils/db');

exports.main = async (event) => {
  try {
    // Authenticate user
    const user = await getUserFromRequest(event);
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
        },
        body: '',
      };
    }

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Content-Type': 'application/json'
    };

    const { 
      limit = 50, 
      offset = 0, 
      search = '', 
      date_from = '', 
      date_to = '',
      type = 'all' // 'all', 'analytics', 'export'
    } = event.queryStringParameters || {};

    // Route to different handlers based on request type
    if (type === 'analytics') {
      return await getAnalytics(user, headers);
    } else if (type === 'export') {
      return await exportHistory(user, event.queryStringParameters, headers);
    } else {
      return await getHistory(user, { limit, offset, search, date_from, date_to }, headers);
    }

  } catch (error) {
    console.error('History handler error:', error);
    
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

// Get query history with filtering
async function getHistory(user, { limit, offset, search, date_from, date_to }, headers) {
  let whereClause = 'WHERE user_id = $1';
  let params = [user.id];
  let paramIndex = 2;

  // Add search filter
  if (search && search.trim()) {
    whereClause += ` AND (query ILIKE $${paramIndex} OR response ILIKE $${paramIndex})`;
    params.push(`%${search.trim()}%`);
    paramIndex++;
  }

  // Add date range filter
  if (date_from) {
    whereClause += ` AND created_at >= $${paramIndex}`;
    params.push(new Date(date_from));
    paramIndex++;
  }

  if (date_to) {
    whereClause += ` AND created_at <= $${paramIndex}`;
    params.push(new Date(date_to));
    paramIndex++;
  }

  const result = await db.query(
    `SELECT id, query, response, created_at 
     FROM query_history 
     ${whereClause}
     ORDER BY created_at DESC 
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, parseInt(limit), parseInt(offset)]
  );

  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM query_history ${whereClause}`,
    params.slice(0, -2) // Remove limit and offset from count query
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      history: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset),
      filters: { search, date_from, date_to }
    })
  };
}

// Get analytics and insights
async function getAnalytics(user, headers) {
  try {
    // Query statistics
    const queryStats = await db.query(`
      SELECT 
        COUNT(*) as total_queries,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        AVG(LENGTH(query)) as avg_query_length,
        MAX(created_at) as last_query,
        MIN(created_at) as first_query
      FROM query_history 
      WHERE user_id = $1
    `, [user.id]);

    // Connection statistics
    const connectionStats = await db.query(`
      SELECT 
        COUNT(*) as total_connections,
        COUNT(DISTINCT company) as unique_companies,
        COUNT(DISTINCT CASE WHEN company IS NOT NULL AND company != '' THEN company END) as companies_with_name,
        MAX(imported_at) as last_import
      FROM connections 
      WHERE user_id = $1
    `, [user.id]);

    // Query frequency by day (last 30 days)
    const queryFrequency = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM query_history 
      WHERE user_id = $1 
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [user.id]);

    // Top companies by connection count
    const topCompanies = await db.query(`
      SELECT 
        company,
        COUNT(*) as connection_count
      FROM connections 
      WHERE user_id = $1 
        AND company IS NOT NULL 
        AND company != ''
      GROUP BY company
      ORDER BY connection_count DESC
      LIMIT 10
    `, [user.id]);

    // Recent query patterns
    const recentQueries = await db.query(`
      SELECT 
        query,
        created_at,
        LENGTH(response) as response_length
      FROM query_history 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [user.id]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        query_stats: queryStats.rows[0],
        connection_stats: connectionStats.rows[0],
        query_frequency: queryFrequency.rows,
        top_companies: topCompanies.rows,
        recent_queries: recentQueries.rows
      })
    };

  } catch (error) {
    console.error('Analytics error:', error);
    throw error;
  }
}

// Export conversation transcripts
async function exportHistory(user, params, headers) {
  const { format = 'json', date_from = '', date_to = '' } = params;

  let whereClause = 'WHERE user_id = $1';
  let queryParams = [user.id];
  let paramIndex = 2;

  // Add date range filter for export
  if (date_from) {
    whereClause += ` AND created_at >= $${paramIndex}`;
    queryParams.push(new Date(date_from));
    paramIndex++;
  }

  if (date_to) {
    whereClause += ` AND created_at <= $${paramIndex}`;
    queryParams.push(new Date(date_to));
    paramIndex++;
  }

  const result = await db.query(
    `SELECT id, query, response, created_at 
     FROM query_history 
     ${whereClause}
     ORDER BY created_at DESC`,
    queryParams
  );

  const data = result.rows;

  if (format === 'csv') {
    // Generate CSV format
    const csvHeader = 'ID,Query,Response,Created At\n';
    const csvRows = data.map(row => 
      `"${row.id}","${row.query.replace(/"/g, '""')}","${row.response.replace(/"/g, '""')}","${row.created_at}"`
    ).join('\n');
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="pnit-history-${new Date().toISOString().split('T')[0]}.csv"`
      },
      body: csvHeader + csvRows
    };
    
  } else if (format === 'txt') {
    // Generate plain text transcript format
    const transcript = data.map(row => 
      `[${new Date(row.created_at).toLocaleString()}] Query: ${row.query}\n\nResponse:\n${row.response}\n\n${'='.repeat(80)}\n`
    ).join('\n');
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="pnit-transcript-${new Date().toISOString().split('T')[0]}.txt"`
      },
      body: transcript
    };
    
  } else {
    // Default JSON format
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Disposition': `attachment; filename="pnit-history-${new Date().toISOString().split('T')[0]}.json"`
      },
      body: JSON.stringify({
        exported_at: new Date().toISOString(),
        user_id: user.id,
        total_records: data.length,
        date_range: { from: date_from || null, to: date_to || null },
        history: data
      }, null, 2)
    };
  }
}