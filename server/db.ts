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

export const db = drizzle(sqlite, { schema });