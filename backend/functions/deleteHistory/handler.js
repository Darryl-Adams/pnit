const db = require('../../utils/db');

exports.main = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { user_id, history_id } = body;
    
    if (!user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing user_id in request body." })
      };
    }

    let result;
    if (history_id) {
      // Delete specific history entry
      result = await db.query(
        'DELETE FROM query_history WHERE id = $1 AND user_id = $2',
        [history_id, user_id]
      );
      
      if (result.rowCount === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'History entry not found or unauthorized.' })
        };
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'History entry deleted successfully.' })
      };
    } else {
      // Delete all history for user
      result = await db.query(
        'DELETE FROM query_history WHERE user_id = $1',
        [user_id]
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: `Deleted ${result.rowCount} history entries.` 
        })
      };
    }
  } catch (error) {
    console.error('Error deleting history:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};