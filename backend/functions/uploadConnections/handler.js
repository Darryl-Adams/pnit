const { getUserFromRequest } = require('../../utils/auth');
const { LinkedInDataProcessor } = require('../../utils/linkedinProcessor');

exports.main = async (event) => {
  try {
    // Authenticate user
    const user = await getUserFromRequest(event);
    
    const body = JSON.parse(event.body);
    const { csv_data } = body;
    
    if (!csv_data) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        body: JSON.stringify({ error: "Missing csv_data in request body." })
      };
    }

    // Initialize the LinkedIn data processor
    const processor = new LinkedInDataProcessor();

    // Parse and validate CSV data
    console.log('Parsing CSV data...');
    const { records, errors: parseErrors } = await processor.parseCSV(csv_data);
    
    if (records.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        body: JSON.stringify({ 
          error: "No valid records found in CSV file",
          parse_errors: parseErrors
        })
      };
    }

    console.log(`Parsed ${records.length} records, ${parseErrors.length} parse errors`);

    // Process the records (includes duplicate detection and merging)
    console.log('Processing records with duplicate detection...');
    const results = await processor.processBatch(user.id, records);

    // Prepare response
    const response = {
      message: `Successfully processed ${results.processed} records`,
      summary: {
        total_processed: results.processed,
        new_connections: results.inserted,
        updated_connections: results.updated,
        duplicates_found: results.duplicates,
        parse_errors: parseErrors.length,
        processing_errors: results.errors.length
      }
    };

    // Include errors if any occurred
    if (parseErrors.length > 0 || results.errors.length > 0) {
      response.errors = {
        parse_errors: parseErrors.slice(0, 10), // Limit to first 10 for response size
        processing_errors: results.errors.slice(0, 10)
      };
    }

    console.log('Upload completed:', response.summary);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error uploading connections:', error);
    
    // Handle authentication errors
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
      })
    };
  }
};
