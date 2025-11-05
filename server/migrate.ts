import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create SQLite database file
const sqlite = new Database(path.join(dataDir, 'webvar.db'));

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

// Create tables manually since we can't use migrations folder
console.log('Creating database tables...');

// Create sessions table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire INTEGER NOT NULL
  )
`);
sqlite.exec(`CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire)`);

// Create users table  
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )
`);

// Create variable_definitions table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS variable_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    default_value TEXT,
    enum_type TEXT,
    owner_id TEXT NOT NULL,
    owner_type TEXT NOT NULL DEFAULT 'user',
    read_permission TEXT NOT NULL DEFAULT 'variable_owner',
    write_permission TEXT NOT NULL DEFAULT 'variable_owner',
    list_permission TEXT NOT NULL DEFAULT 'definition_owner',
    is_read_only INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )
`);
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_variable_definitions_list_permission ON variable_definitions(list_permission)`);
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_variable_definitions_owner_list ON variable_definitions(owner_id, list_permission)`);
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_variable_definitions_updated_at ON variable_definitions(updated_at)`);

// Create variable_values table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS variable_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    definition_id INTEGER NOT NULL REFERENCES variable_definitions(id) ON DELETE CASCADE,
    owner_id TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )
`);
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_variable_values_definition_owner ON variable_values(definition_id, owner_id)`);

// Create api_keys table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_used INTEGER,
    created_at INTEGER DEFAULT (unixepoch())
  )
`);

// Create webhooks table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    secret TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )
`);

console.log('Database tables created successfully!');
console.log('SQLite database location:', path.join(dataDir, 'webvar.db'));

sqlite.close();