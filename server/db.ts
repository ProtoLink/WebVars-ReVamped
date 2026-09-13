import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
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

// Enable Write-Ahead Logging for better concurrent performance
sqlite.pragma('journal_mode = WAL');

// Initialize an empty local database without requiring a tracked database file.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS variable_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'string',
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
  );
  CREATE INDEX IF NOT EXISTS idx_variable_definitions_list_permission ON variable_definitions(list_permission);
  CREATE INDEX IF NOT EXISTS idx_variable_definitions_owner_list ON variable_definitions(owner_id, list_permission);
  CREATE INDEX IF NOT EXISTS idx_variable_definitions_updated_at ON variable_definitions(updated_at);

  CREATE TABLE IF NOT EXISTS variable_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    definition_id INTEGER NOT NULL REFERENCES variable_definitions(id) ON DELETE CASCADE,
    owner_id TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_variable_values_definition_owner ON variable_values(definition_id, owner_id);

  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_used INTEGER,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    secret TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
`);

// Normalize legacy typed definitions to the app's string-only variable model.
// Defaults and user values already live in text columns, so their contents are
// preserved exactly while only the definition metadata changes.
const hasVariableDefinitionsTable = sqlite
  .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'variable_definitions'")
  .get();

if (hasVariableDefinitionsTable) {
  const migration = sqlite
    .prepare("UPDATE variable_definitions SET type = 'string', enum_type = NULL WHERE type <> 'string' OR enum_type IS NOT NULL")
    .run();

  if (migration.changes > 0) {
    console.log(`Converted ${migration.changes} existing variable definition(s) to string type`);
  }
}

export const db = drizzle(sqlite, { schema });