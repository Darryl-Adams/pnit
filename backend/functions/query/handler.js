require('dotenv').config();

const { OpenAI } = require("openai");
const db = require('../../utils/db');
const { getUserFromRequest } = require('../../utils/auth');
const { searchConnections, parseSearchIntent } = require('../../utils/searchEngine');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set this in your .env or Windsurf environment
});

exports.main = async (event) => {
  try {
    // Authenticate user
    const user = await getUserFromRequest(event);
    
    const body = JSON.parse(event.body);
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        body: JSON.stringify({ error: "Missing or invalid 'message' in request body." })
      };
    }

    // Get user's connection count for context
    const connectionCountResult = await db.query(
      'SELECT COUNT(*) as count FROM connections WHERE user_id = $1',
      [user.id]
    );
    const connectionCount = parseInt(connectionCountResult.rows[0].count);

    // Build OpenAI message history (system + past messages + new user input)
    const messages = [
      {
        role: "system",
        content: `You are PNIT, a helpful AI assistant that helps ${user.name || 'the user'} search their professional LinkedIn network of ${connectionCount} connections. 

When users ask about their network, you should:
1. Parse their query to understand what they're looking for (company, role, name, industry, experience level)
2. Provide a helpful, conversational response
3. Include a JSON object with search criteria: { "company": "string", "role": "string", "name": "string", "industry": "string", "experienceLevel": "string" }

Be conversational and helpful. If no specific criteria are mentioned, ask clarifying questions.`
      },
      ...history,
      {
        role: "user",
        content: message
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.3,
    });

    const assistantReply = response.choices[0].message.content;

    // Enhanced search with multiple approaches
    let searchResults = [];
    let searchSummary = '';
    
    try {
      // Approach 1: Try to extract JSON from AI response
      let searchFilters = {};
      const jsonMatch = assistantReply.match(/\{[^}]*\}/);
      if (jsonMatch) {
        try {
          const aiFilters = JSON.parse(jsonMatch[0]);
          searchFilters = { ...aiFilters };
        } catch (jsonError) {
          console.log('JSON parsing failed, using intent parsing');
        }
      }
      
      // Approach 2: Use intent parsing as fallback
      const intentFilters = parseSearchIntent(message);
      searchFilters = { ...intentFilters, ...searchFilters };
      
      // Perform search if we have any filters
      const hasFilters = Object.values(searchFilters).some(value => value !== null && value !== '');
      
      if (hasFilters) {
        const searchResult = await searchConnections(user.id, message, searchFilters);
        searchResults = searchResult.results;
        
        // Create search summary
        const filterDescriptions = [];
        if (searchFilters.company) filterDescriptions.push(`company: ${searchFilters.company}`);
        if (searchFilters.role) filterDescriptions.push(`role: ${searchFilters.role}`);
        if (searchFilters.name) filterDescriptions.push(`name: ${searchFilters.name}`);
        if (searchFilters.industry) filterDescriptions.push(`industry: ${searchFilters.industry}`);
        if (searchFilters.experienceLevel) filterDescriptions.push(`level: ${searchFilters.experienceLevel}`);
        
        searchSummary = `Searched ${connectionCount} connections with filters: ${filterDescriptions.join(', ')}`;
      } else {
        searchSummary = 'No specific search criteria detected. Ask me about specific companies, roles, or people in your network.';
      }
      
    } catch (searchError) {
      console.error('Search error:', searchError);
      searchSummary = `Search error: ${searchError.message}`;
    }

    // Save query to history
    await db.query(
      'INSERT INTO query_history (user_id, query, response, created_at) VALUES ($1, $2, $3, NOW())',
      [user.id, message, assistantReply]
    );

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistant_message: assistantReply,
        results: searchResults,
        search_summary: searchSummary,
        user: {
          id: user.id,
          name: user.name,
          connection_count: connectionCount
        }
      }),
    };
  } catch (error) {
    console.error("Query error:", error);
    
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
      body: JSON.stringify({ error: "Internal server error", details: error.message }),
    };
  }
};

  