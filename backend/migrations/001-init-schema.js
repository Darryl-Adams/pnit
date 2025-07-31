/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = pgm => {
  // users table
  pgm.createTable('users', {
    id: 'id',
    linkedin_id: { type: 'varchar(128)', notNull: true, unique: true },
    email: { type: 'varchar(255)', unique: true },
    name: { type: 'varchar(255)' },
    profile_url: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // connections table
  pgm.createTable('connections', {
    id: 'id',
    user_id: { type: 'integer', references: 'users', onDelete: 'CASCADE' },
    first_name: { type: 'varchar(100)' },
    last_name: { type: 'varchar(100)' },
    company: { type: 'varchar(255)' },
    position: { type: 'varchar(255)' },
    profile_url: { type: 'text' },
    imported_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // query_history table
  pgm.createTable('query_history', {
    id: 'id',
    user_id: { type: 'integer', references: 'users', onDelete: 'CASCADE' },
    query: { type: 'text', notNull: true },
    response: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // conversations table (optional)
  pgm.createTable('conversations', {
    id: 'id',
    user_id: { type: 'integer', references: 'users', onDelete: 'CASCADE' },
    started_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // messages table (optional)
  pgm.createTable('messages', {
    id: 'id',
    conversation_id: { type: 'integer', references: 'conversations', onDelete: 'CASCADE' },
    sender: { type: 'varchar(32)' },
    message: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });
};

exports.down = pgm => {
  pgm.dropTable('messages');
  pgm.dropTable('conversations');
  pgm.dropTable('query_history');
  pgm.dropTable('connections');
  pgm.dropTable('users');
};
