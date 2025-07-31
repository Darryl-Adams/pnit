const csv = require('csv-parser');
const { Readable } = require('stream');
const db = require('./db');

// LinkedIn CSV field mappings (supports multiple LinkedIn export formats)
const FIELD_MAPPINGS = {
  // Standard LinkedIn export format
  'First Name': ['first_name', 'firstName', 'First Name'],
  'Last Name': ['last_name', 'lastName', 'Last Name'], 
  'Email Address': ['email', 'Email Address', 'Email'],
  'Company': ['company', 'Company', 'Current Company'],
  'Position': ['position', 'Position', 'Job Title', 'Title'],
  'Connected On': ['connected_on', 'Connected On', 'Connection Date'],
  'Profile URL': ['profile_url', 'Profile URL', 'LinkedIn Profile', 'URL'],
  
  // Alternative formats
  'URL': ['profile_url', 'URL', 'LinkedIn URL'],
  'Email': ['email', 'Email', 'Email Address'],
  'Job Title': ['position', 'Job Title', 'Position', 'Title'],
  'Current Company': ['company', 'Current Company', 'Company'],
  'Connected': ['connected_on', 'Connected', 'Connected On'],
};

// Data normalization functions
class LinkedInDataProcessor {
  constructor() {
    this.processedCount = 0;
    this.duplicateCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
  }

  // Parse CSV with flexible field mapping
  async parseCSV(csvData) {
    const records = [];
    const errors = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from(csvData)
        .pipe(csv({
          mapHeaders: ({ header }) => this.normalizeHeader(header),
          skipEmptyLines: true,
          strict: false
        }))
        .on('data', (data) => {
          try {
            const normalized = this.normalizeRecord(data);
            if (normalized) {
              records.push(normalized);
            }
          } catch (error) {
            errors.push({ row: records.length + 1, error: error.message, data });
          }
        })
        .on('end', () => {
          resolve({ records, errors });
        })
        .on('error', (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        });
    });
  }

  // Normalize CSV headers to standard field names
  normalizeHeader(header) {
    const cleanHeader = header.trim().replace(/['"]/g, '');
    
    // Direct mapping
    for (const [standardField, variants] of Object.entries(FIELD_MAPPINGS)) {
      if (variants.includes(cleanHeader)) {
        return standardField;
      }
    }
    
    // Fuzzy matching for common variations
    const lowerHeader = cleanHeader.toLowerCase();
    if (lowerHeader.includes('first') && lowerHeader.includes('name')) return 'First Name';
    if (lowerHeader.includes('last') && lowerHeader.includes('name')) return 'Last Name';
    if (lowerHeader.includes('email')) return 'Email Address';
    if (lowerHeader.includes('company')) return 'Company';
    if (lowerHeader.includes('position') || lowerHeader.includes('title') || lowerHeader.includes('job')) return 'Position';
    if (lowerHeader.includes('url') || lowerHeader.includes('profile')) return 'Profile URL';
    if (lowerHeader.includes('connect')) return 'Connected On';
    
    return cleanHeader; // Keep original if no mapping found
  }

  // Normalize and validate a single record
  normalizeRecord(rawData) {
    const record = {
      first_name: this.cleanText(rawData['First Name']),
      last_name: this.cleanText(rawData['Last Name']),
      email: this.cleanEmail(rawData['Email Address']),
      company: this.cleanCompany(rawData['Company']),
      position: this.cleanPosition(rawData['Position']),
      profile_url: this.cleanURL(rawData['Profile URL']),
      connected_on: this.parseDate(rawData['Connected On']),
      batch_id: null // Will be set during processing
    };

    // Validation - require at least first name and last name
    if (!record.first_name || !record.last_name) {
      throw new Error('Missing required fields: first_name and last_name');
    }

    // Additional validation
    if (record.first_name.length > 100 || record.last_name.length > 100) {
      throw new Error('Name fields too long (max 100 characters)');
    }

    if (record.company && record.company.length > 255) {
      record.company = record.company.substring(0, 255);
    }

    if (record.position && record.position.length > 255) {
      record.position = record.position.substring(0, 255);
    }

    return record;
  }

  // Text cleaning utility
  cleanText(text) {
    if (!text) return null;
    return text.toString()
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[""'']/g, '"') // Normalize quotes
      .replace(/[–—]/g, '-') // Normalize dashes
      || null;
  }

  // Email cleaning and validation
  cleanEmail(email) {
    if (!email) return null;
    const cleaned = email.toString().trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleaned) ? cleaned : null;
  }

  // Company name normalization
  cleanCompany(company) {
    if (!company) return null;
    
    let cleaned = this.cleanText(company);
    if (!cleaned) return null;

    // Common company name normalizations
    const patterns = [
      // Remove common suffixes for better matching
      { from: /\s+(Inc\.?|LLC\.?|Ltd\.?|Corp\.?|Corporation|Company|Co\.?)$/i, to: '' },
      // Normalize ampersands
      { from: /\s+&\s+/g, to: ' & ' },
      // Remove extra whitespace around parentheses
      { from: /\s*\(\s*/g, to: ' (' },
      { from: /\s*\)\s*/g, to: ') ' },
    ];

    patterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern.from, pattern.to).trim();
    });

    return cleaned;
  }

  // Position/title normalization
  cleanPosition(position) {
    if (!position) return null;
    
    let cleaned = this.cleanText(position);
    if (!cleaned) return null;

    // Common position normalizations
    const patterns = [
      // Normalize common abbreviations
      { from: /\bVP\b/gi, to: 'Vice President' },
      { from: /\bSVP\b/gi, to: 'Senior Vice President' },
      { from: /\bEVP\b/gi, to: 'Executive Vice President' },
      { from: /\bCEO\b/gi, to: 'Chief Executive Officer' },
      { from: /\bCTO\b/gi, to: 'Chief Technology Officer' },
      { from: /\bCFO\b/gi, to: 'Chief Financial Officer' },
      { from: /\bSr\.?\b/gi, to: 'Senior' },
      { from: /\bJr\.?\b/gi, to: 'Junior' },
    ];

    patterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern.from, pattern.to);
    });

    return cleaned.trim();
  }

  // URL cleaning and validation
  cleanURL(url) {
    if (!url) return null;
    
    let cleaned = url.toString().trim();
    
    // Add protocol if missing
    if (cleaned && !cleaned.startsWith('http')) {
      cleaned = 'https://' + cleaned;
    }

    // Validate URL format
    try {
      new URL(cleaned);
      return cleaned;
    } catch {
      return null; // Invalid URL
    }
  }

  // Date parsing for Connected On field
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  }

  // Generate duplicate detection key
  generateDuplicateKey(record) {
    // Primary key: first_name + last_name + company (case insensitive)
    const key1 = [
      record.first_name?.toLowerCase() || '',
      record.last_name?.toLowerCase() || '',
      record.company?.toLowerCase() || ''
    ].join('|');

    // Secondary key: email if available
    const key2 = record.email ? `email:${record.email.toLowerCase()}` : null;

    // Tertiary key: profile_url if available
    const key3 = record.profile_url ? `url:${record.profile_url.toLowerCase()}` : null;

    return [key1, key2, key3].filter(Boolean);
  }

  // Detect duplicates within the batch
  detectBatchDuplicates(records) {
    const seen = new Map();
    const duplicates = [];
    const unique = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const keys = this.generateDuplicateKey(record);
      
      let isDuplicate = false;
      for (const key of keys) {
        if (seen.has(key)) {
          duplicates.push({
            index: i,
            record,
            duplicateOf: seen.get(key),
            duplicateKey: key
          });
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        unique.push(record);
        // Store all keys for this record
        keys.forEach(key => seen.set(key, i));
      }
    }

    return { unique, duplicates };
  }

  // Check for existing duplicates in database
  async detectDatabaseDuplicates(userId, records) {
    const duplicates = [];
    const unique = [];

    for (const record of records) {
      // Check for exact matches first
      let existingQuery = `
        SELECT id, first_name, last_name, company, position, email, profile_url 
        FROM connections 
        WHERE user_id = $1 AND (
          (LOWER(first_name) = LOWER($2) AND LOWER(last_name) = LOWER($3) AND 
           (company IS NULL OR LOWER(company) = LOWER($4)))
      `;
      let queryParams = [userId, record.first_name, record.last_name, record.company];
      let paramIndex = 5;

      // Add email check if available
      if (record.email) {
        existingQuery += ` OR LOWER(email) = LOWER($${paramIndex})`;
        queryParams.push(record.email);
        paramIndex++;
      }

      // Add profile URL check if available
      if (record.profile_url) {
        existingQuery += ` OR LOWER(profile_url) = LOWER($${paramIndex})`;
        queryParams.push(record.profile_url);
        paramIndex++;
      }

      existingQuery += ')';

      try {
        const result = await db.query(existingQuery, queryParams);
        
        if (result.rows.length > 0) {
          duplicates.push({
            record,
            existing: result.rows[0],
            reason: 'Database duplicate found'
          });
        } else {
          unique.push(record);
        }
      } catch (error) {
        console.error('Duplicate check error:', error);
        unique.push(record); // Include if check fails
      }
    }

    return { unique, duplicates };
  }

  // Merge duplicate records intelligently
  mergeRecords(existing, newRecord) {
    const merged = { ...existing };

    // Merge strategy: prefer non-null, more complete data
    const fields = ['first_name', 'last_name', 'email', 'company', 'position', 'profile_url'];
    
    fields.forEach(field => {
      if (!merged[field] && newRecord[field]) {
        merged[field] = newRecord[field];
      } else if (merged[field] && newRecord[field] && newRecord[field].length > merged[field].length) {
        // Prefer longer, more descriptive values
        merged[field] = newRecord[field];
      }
    });

    // Always update connected_on to most recent
    if (newRecord.connected_on) {
      merged.connected_on = newRecord.connected_on;
    }

    return merged;
  }

  // Process records in batches for better performance
  async processBatch(userId, records, batchSize = 100) {
    const results = {
      processed: 0,
      inserted: 0,
      updated: 0,
      duplicates: 0,
      errors: []
    };

    // Generate batch ID for tracking this import
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        // Detect batch-internal duplicates
        const { unique: batchUnique, duplicates: batchDuplicates } = this.detectBatchDuplicates(batch);
        results.duplicates += batchDuplicates.length;

        // Check against existing database records
        const { unique: dbUnique, duplicates: dbDuplicates } = await this.detectDatabaseDuplicates(userId, batchUnique);
        results.duplicates += dbDuplicates.length;

        // Process updates for database duplicates
        for (const dup of dbDuplicates) {
          try {
            const merged = this.mergeRecords(dup.existing, dup.record);
            
            await db.query(`
              UPDATE connections 
              SET company = $1, position = $2, email = $3, profile_url = $4, 
                  connected_on = $5, imported_at = NOW()
              WHERE id = $6
            `, [merged.company, merged.position, merged.email, merged.profile_url, 
                merged.connected_on, dup.existing.id]);
            
            results.updated++;
          } catch (error) {
            results.errors.push({
              record: dup.record,
              error: `Update failed: ${error.message}`
            });
          }
        }

        // Insert new unique records
        for (const record of dbUnique) {
          try {
            await db.query(`
              INSERT INTO connections 
              (user_id, first_name, last_name, company, position, email, profile_url, connected_on, batch_id, imported_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            `, [userId, record.first_name, record.last_name, record.company, 
                record.position, record.email, record.profile_url, record.connected_on, batchId]);
            
            results.inserted++;
          } catch (error) {
            results.errors.push({
              record,
              error: `Insert failed: ${error.message}`
            });
          }
        }

        results.processed += batch.length;
        
      } catch (error) {
        results.errors.push({
          batch: i / batchSize + 1,
          error: `Batch processing failed: ${error.message}`
        });
      }
    }

    return results;
  }
}

module.exports = {
  LinkedInDataProcessor,
  FIELD_MAPPINGS
};