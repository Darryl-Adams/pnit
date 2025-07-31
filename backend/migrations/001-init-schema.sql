-- Migration: Initial schema

-- users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    linkedin_id VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    profile_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- connections table
CREATE TABLE IF NOT EXISTS connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    position VARCHAR(255),
    profile_url TEXT,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- query_history table
CREATE TABLE IF NOT EXISTS query_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- conversations table (optional)
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- messages table (optional)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(32), -- 'user' or 'assistant'
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
