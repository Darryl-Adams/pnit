-- Migration: Add email, connected_on, batch_id columns and create performance indexes

-- Add new columns (using IF NOT EXISTS for safety)
ALTER TABLE connections ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE connections ADD COLUMN IF NOT EXISTS connected_on TIMESTAMP;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS batch_id VARCHAR(50);

-- Create indexes for better performance on duplicate detection and searches
CREATE INDEX IF NOT EXISTS idx_connections_email ON connections(user_id, email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_connections_name_company ON connections(user_id, LOWER(first_name), LOWER(last_name), LOWER(company));
CREATE INDEX IF NOT EXISTS idx_connections_batch_id ON connections(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_connections_connected_on ON connections(connected_on) WHERE connected_on IS NOT NULL;

-- Add a composite index for duplicate detection
CREATE INDEX IF NOT EXISTS idx_connections_duplicate_check ON connections(user_id, LOWER(first_name), LOWER(last_name)) WHERE first_name IS NOT NULL AND last_name IS NOT NULL;

-- Add index for profile URL lookups
CREATE INDEX IF NOT EXISTS idx_connections_profile_url ON connections(user_id, profile_url) WHERE profile_url IS NOT NULL;
