const db = require('./db');

// Advanced search builder for connection queries
class ConnectionSearchEngine {
  constructor(userId) {
    this.userId = userId;
    this.query = 'SELECT first_name, last_name, company, position, profile_url FROM connections WHERE user_id = $1';
    this.params = [userId];
    this.paramIndex = 2;
  }

  // Add company filter with fuzzy matching
  filterByCompany(company) {
    if (!company) return this;
    
    this.query += ` AND (
      LOWER(company) LIKE LOWER($${this.paramIndex}) OR
      LOWER(company) LIKE LOWER($${this.paramIndex + 1}) OR
      LOWER(company) LIKE LOWER($${this.paramIndex + 2})
    )`;
    
    // Multiple variations for better matching
    this.params.push(
      `%${company}%`,           // Contains
      `${company}%`,            // Starts with
      `%${company.split(' ')[0]}%` // First word contains
    );
    this.paramIndex += 3;
    return this;
  }

  // Add position/role filter with synonym matching
  filterByPosition(position) {
    if (!position) return this;
    
    // Common role synonyms
    const synonyms = this.getRoleSynonyms(position);
    const synonymPlaceholders = synonyms.map((_, index) => `LOWER(position) LIKE LOWER($${this.paramIndex + index})`).join(' OR ');
    
    this.query += ` AND (${synonymPlaceholders})`;
    this.params.push(...synonyms.map(syn => `%${syn}%`));
    this.paramIndex += synonyms.length;
    return this;
  }

  // Add name filter (first or last name)
  filterByName(name) {
    if (!name) return this;
    
    this.query += ` AND (
      LOWER(first_name) LIKE LOWER($${this.paramIndex}) OR
      LOWER(last_name) LIKE LOWER($${this.paramIndex + 1}) OR
      CONCAT(LOWER(first_name), ' ', LOWER(last_name)) LIKE LOWER($${this.paramIndex + 2})
    )`;
    
    this.params.push(`%${name}%`, `%${name}%`, `%${name}%`);
    this.paramIndex += 3;
    return this;
  }

  // Add industry-based filtering (inferred from company names)
  filterByIndustry(industry) {
    if (!industry) return this;
    
    const industryKeywords = this.getIndustryKeywords(industry.toLowerCase());
    const keywordPlaceholders = industryKeywords.map((_, index) => `LOWER(company) LIKE LOWER($${this.paramIndex + index})`).join(' OR ');
    
    if (industryKeywords.length > 0) {
      this.query += ` AND (${keywordPlaceholders})`;
      this.params.push(...industryKeywords.map(keyword => `%${keyword}%`));
      this.paramIndex += industryKeywords.length;
    }
    return this;
  }

  // Add experience level filter (inferred from position titles)
  filterByExperienceLevel(level) {
    if (!level) return this;
    
    const levelKeywords = this.getExperienceLevelKeywords(level.toLowerCase());
    const keywordPlaceholders = levelKeywords.map((_, index) => `LOWER(position) LIKE LOWER($${this.paramIndex + index})`).join(' OR ');
    
    if (levelKeywords.length > 0) {
      this.query += ` AND (${keywordPlaceholders})`;
      this.params.push(...levelKeywords.map(keyword => `%${keyword}%`));
      this.paramIndex += levelKeywords.length;
    }
    return this;
  }

  // Add location filter (if position contains location info)
  filterByLocation(location) {
    if (!location) return this;
    
    this.query += ` AND (
      LOWER(position) LIKE LOWER($${this.paramIndex}) OR
      LOWER(company) LIKE LOWER($${this.paramIndex + 1})
    )`;
    
    this.params.push(`%${location}%`, `%${location}%`);
    this.paramIndex += 2;
    return this;
  }

  // Add sorting and pagination
  orderBy(field = 'first_name', direction = 'ASC') {
    const validFields = ['first_name', 'last_name', 'company', 'position'];
    const validDirections = ['ASC', 'DESC'];
    
    if (validFields.includes(field) && validDirections.includes(direction.toUpperCase())) {
      this.query += ` ORDER BY ${field} ${direction.toUpperCase()}`;
    }
    return this;
  }

  limit(count = 50) {
    this.query += ` LIMIT $${this.paramIndex}`;
    this.params.push(Math.min(count, 200)); // Max 200 results
    this.paramIndex += 1;
    return this;
  }

  // Execute the search
  async execute() {
    try {
      const result = await db.query(this.query, this.params);
      return {
        results: result.rows,
        count: result.rows.length,
        query: this.query,
        params: this.params
      };
    } catch (error) {
      throw new Error(`Search execution failed: ${error.message}`);
    }
  }

  // Get role synonyms for better matching
  getRoleSynonyms(role) {
    const roleMap = {
      'engineer': ['engineer', 'developer', 'programmer', 'architect'],
      'developer': ['developer', 'engineer', 'programmer', 'coder'],
      'manager': ['manager', 'lead', 'director', 'head'],
      'director': ['director', 'head', 'vp', 'vice president'],
      'analyst': ['analyst', 'researcher', 'specialist'],
      'designer': ['designer', 'ux', 'ui', 'creative'],
      'product': ['product', 'pm', 'product manager'],
      'marketing': ['marketing', 'growth', 'brand', 'digital marketing'],
      'sales': ['sales', 'business development', 'account'],
      'consultant': ['consultant', 'advisor', 'specialist'],
      'founder': ['founder', 'ceo', 'entrepreneur', 'co-founder'],
      'data': ['data', 'analytics', 'scientist', 'ml', 'ai']
    };

    const lowerRole = role.toLowerCase();
    for (const [key, synonyms] of Object.entries(roleMap)) {
      if (lowerRole.includes(key)) {
        return synonyms;
      }
    }
    
    return [role]; // Return original if no synonyms found
  }

  // Get industry keywords for company matching
  getIndustryKeywords(industry) {
    const industryMap = {
      'tech': ['google', 'microsoft', 'apple', 'amazon', 'meta', 'netflix', 'uber', 'airbnb', 'stripe', 'salesforce'],
      'finance': ['goldman', 'morgan', 'bank', 'capital', 'financial', 'investment', 'credit'],
      'consulting': ['mckinsey', 'bain', 'bcg', 'deloitte', 'pwc', 'accenture', 'kpmg'],
      'healthcare': ['hospital', 'medical', 'pharma', 'health', 'biotech', 'clinic'],
      'education': ['university', 'school', 'education', 'learning', 'academic'],
      'retail': ['walmart', 'target', 'retail', 'store', 'shopping'],
      'media': ['disney', 'warner', 'media', 'entertainment', 'news', 'publishing'],
      'automotive': ['tesla', 'ford', 'gm', 'automotive', 'car', 'vehicle']
    };

    return industryMap[industry] || [];
  }

  // Get experience level keywords
  getExperienceLevelKeywords(level) {
    const levelMap = {
      'senior': ['senior', 'sr', 'principal', 'staff', 'lead'],
      'junior': ['junior', 'jr', 'associate', 'entry', 'intern'],
      'manager': ['manager', 'mgr', 'lead', 'supervisor'],
      'director': ['director', 'head', 'vp', 'vice president'],
      'executive': ['ceo', 'cto', 'cfo', 'president', 'founder'],
      'mid': ['mid', 'intermediate', 'specialist']
    };

    return levelMap[level] || [];
  }
}

// AI-powered search intent parser
const parseSearchIntent = (query) => {
  const intent = {
    company: null,
    position: null,
    name: null,
    industry: null,
    experienceLevel: null,
    location: null
  };

  const lowerQuery = query.toLowerCase();

  // Extract company names (look for "at", "from", "works at")
  const companyPatterns = [
    /(?:at|from|works at|employed at|with)\s+([a-zA-Z0-9\s&.-]+?)(?:\s|$|,|\.|!|\?)/gi,
    /([a-zA-Z0-9&.-]+(?:\s+inc|ltd|llc|corp|corporation|company))/gi
  ];

  for (const pattern of companyPatterns) {
    const matches = [...lowerQuery.matchAll(pattern)];
    if (matches.length > 0) {
      intent.company = matches[0][1].trim();
      break;
    }
  }

  // Extract positions/roles
  const roleKeywords = ['engineer', 'developer', 'manager', 'director', 'analyst', 'designer', 'consultant', 'founder', 'sales', 'marketing', 'product', 'data'];
  for (const role of roleKeywords) {
    if (lowerQuery.includes(role)) {
      intent.position = role;
      break;
    }
  }

  // Extract experience levels
  const experienceLevels = ['senior', 'junior', 'lead', 'principal', 'staff', 'director', 'manager', 'executive'];
  for (const level of experienceLevels) {
    if (lowerQuery.includes(level)) {
      intent.experienceLevel = level;
      break;
    }
  }

  // Extract industries
  const industries = ['tech', 'finance', 'consulting', 'healthcare', 'education', 'retail', 'media', 'automotive'];
  for (const industry of industries) {
    if (lowerQuery.includes(industry)) {
      intent.industry = industry;
      break;
    }
  }

  // Extract names (look for quoted names or "named", "called")
  const namePatterns = [
    /"([^"]+)"/g,
    /(?:named|called)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/gi
  ];

  for (const pattern of namePatterns) {
    const matches = [...lowerQuery.matchAll(pattern)];
    if (matches.length > 0) {
      intent.name = matches[0][1].trim();
      break;
    }
  }

  return intent;
};

// Main search function
const searchConnections = async (userId, query, filters = {}) => {
  const searchEngine = new ConnectionSearchEngine(userId);
  
  // Apply filters from AI parsing or explicit filters
  const searchIntent = parseSearchIntent(query);
  const combinedFilters = { ...searchIntent, ...filters };

  if (combinedFilters.company) {
    searchEngine.filterByCompany(combinedFilters.company);
  }
  
  if (combinedFilters.position) {
    searchEngine.filterByPosition(combinedFilters.position);
  }
  
  if (combinedFilters.name) {
    searchEngine.filterByName(combinedFilters.name);
  }
  
  if (combinedFilters.industry) {
    searchEngine.filterByIndustry(combinedFilters.industry);
  }
  
  if (combinedFilters.experienceLevel) {
    searchEngine.filterByExperienceLevel(combinedFilters.experienceLevel);
  }
  
  if (combinedFilters.location) {
    searchEngine.filterByLocation(combinedFilters.location);
  }

  // Apply sorting and limits
  searchEngine
    .orderBy(filters.sortBy || 'first_name', filters.sortOrder || 'ASC')
    .limit(filters.limit || 50);

  return await searchEngine.execute();
};

module.exports = {
  ConnectionSearchEngine,
  parseSearchIntent,
  searchConnections
};