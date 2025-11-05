#!/usr/bin/env tsx
import { Client } from 'pg';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../shared/schema';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

async function migratePostgreSQLToSQLite() {
  console.log(`${colors.blue}🚀 Starting PostgreSQL to SQLite Migration${colors.reset}\n`);
  
  // Connect to PostgreSQL
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await pgClient.connect();
    console.log(`${colors.green}✅ Connected to PostgreSQL${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Failed to connect to PostgreSQL:${colors.reset}`, error);
    process.exit(1);
  }

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Connect to SQLite
  const sqliteDb = new Database(path.join(dataDir, 'webvar.db'));
  sqliteDb.pragma('foreign_keys = OFF'); // Temporarily disable to insert data
  sqliteDb.pragma('journal_mode = WAL');
  
  console.log(`${colors.green}✅ Connected to SQLite${colors.reset}`);

  try {
    // Step 1: Migrate Users
    console.log(`\n${colors.cyan}📦 Migrating Users...${colors.reset}`);
    const usersResult = await pgClient.query('SELECT * FROM users ORDER BY created_at');
    console.log(`   Found ${usersResult.rows.length} users`);
    
    const insertUser = sqliteDb.prepare(`
      INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, profile_image_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const user of usersResult.rows) {
      // Convert timestamps to Unix epoch (milliseconds)
      const createdAt = user.created_at ? Math.floor(new Date(user.created_at).getTime() / 1000) : null;
      const updatedAt = user.updated_at ? Math.floor(new Date(user.updated_at).getTime() / 1000) : null;
      
      insertUser.run(
        user.id,
        user.email,
        user.password_hash,
        user.first_name,
        user.last_name,
        user.profile_image_url,
        createdAt,
        updatedAt
      );
    }
    console.log(`   ${colors.green}✓ Migrated ${usersResult.rows.length} users${colors.reset}`);

    // Step 2: Migrate Variable Definitions
    console.log(`\n${colors.cyan}📦 Migrating Variable Definitions...${colors.reset}`);
    const defsResult = await pgClient.query('SELECT * FROM variable_definitions ORDER BY created_at');
    console.log(`   Found ${defsResult.rows.length} variable definitions`);
    
    const insertDef = sqliteDb.prepare(`
      INSERT OR REPLACE INTO variable_definitions (
        id, name, type, default_value, enum_type, owner_id, owner_type, 
        read_permission, write_permission, list_permission, is_read_only, 
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const def of defsResult.rows) {
      const createdAt = def.created_at ? Math.floor(new Date(def.created_at).getTime() / 1000) : null;
      const updatedAt = def.updated_at ? Math.floor(new Date(def.updated_at).getTime() / 1000) : null;
      
      insertDef.run(
        def.id,
        def.name,
        def.type,
        def.default_value,
        def.enum_type,
        def.owner_id,
        def.owner_type,
        def.read_permission,
        def.write_permission,
        def.list_permission,
        def.is_read_only ? 1 : 0,
        createdAt,
        updatedAt
      );
    }
    console.log(`   ${colors.green}✓ Migrated ${defsResult.rows.length} variable definitions${colors.reset}`);

    // Step 3: Migrate Variable Values
    console.log(`\n${colors.cyan}📦 Migrating Variable Values...${colors.reset}`);
    const valuesResult = await pgClient.query('SELECT * FROM variable_values ORDER BY created_at');
    console.log(`   Found ${valuesResult.rows.length} variable values`);
    
    const insertValue = sqliteDb.prepare(`
      INSERT OR REPLACE INTO variable_values (
        id, definition_id, owner_id, value, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const value of valuesResult.rows) {
      const createdAt = value.created_at ? Math.floor(new Date(value.created_at).getTime() / 1000) : null;
      const updatedAt = value.updated_at ? Math.floor(new Date(value.updated_at).getTime() / 1000) : null;
      
      insertValue.run(
        value.id,
        value.definition_id,
        value.owner_id,
        value.value,
        createdAt,
        updatedAt
      );
    }
    console.log(`   ${colors.green}✓ Migrated ${valuesResult.rows.length} variable values${colors.reset}`);

    // Step 4: Migrate API Keys (if any)
    console.log(`\n${colors.cyan}📦 Migrating API Keys...${colors.reset}`);
    const keysResult = await pgClient.query('SELECT * FROM api_keys ORDER BY created_at');
    console.log(`   Found ${keysResult.rows.length} API keys`);
    
    if (keysResult.rows.length > 0) {
      const insertKey = sqliteDb.prepare(`
        INSERT OR REPLACE INTO api_keys (
          id, user_id, key_hash, name, is_active, last_used, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const key of keysResult.rows) {
        const createdAt = key.created_at ? Math.floor(new Date(key.created_at).getTime() / 1000) : null;
        const lastUsed = key.last_used ? Math.floor(new Date(key.last_used).getTime() / 1000) : null;
        
        insertKey.run(
          key.id,
          key.user_id,
          key.key_hash,
          key.name,
          key.is_active ? 1 : 0,
          lastUsed,
          createdAt
        );
      }
      console.log(`   ${colors.green}✓ Migrated ${keysResult.rows.length} API keys${colors.reset}`);
    }

    // Step 5: Migrate Webhooks (if any)
    console.log(`\n${colors.cyan}📦 Migrating Webhooks...${colors.reset}`);
    const webhooksResult = await pgClient.query('SELECT * FROM webhooks ORDER BY created_at');
    console.log(`   Found ${webhooksResult.rows.length} webhooks`);
    
    if (webhooksResult.rows.length > 0) {
      const insertWebhook = sqliteDb.prepare(`
        INSERT OR REPLACE INTO webhooks (
          id, user_id, url, events, is_active, secret, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const webhook of webhooksResult.rows) {
        const createdAt = webhook.created_at ? Math.floor(new Date(webhook.created_at).getTime() / 1000) : null;
        const updatedAt = webhook.updated_at ? Math.floor(new Date(webhook.updated_at).getTime() / 1000) : null;
        // Convert JSONB to JSON string
        const events = typeof webhook.events === 'object' ? JSON.stringify(webhook.events) : webhook.events;
        
        insertWebhook.run(
          webhook.id,
          webhook.user_id,
          webhook.url,
          events,
          webhook.is_active ? 1 : 0,
          webhook.secret,
          createdAt,
          updatedAt
        );
      }
      console.log(`   ${colors.green}✓ Migrated ${webhooksResult.rows.length} webhooks${colors.reset}`);
    }

    // Re-enable foreign keys
    sqliteDb.pragma('foreign_keys = ON');

    // Step 6: Verify Migration
    console.log(`\n${colors.cyan}🔍 Verifying Migration...${colors.reset}`);
    
    // Count records in SQLite
    const sqliteUserCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const sqliteDefCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM variable_definitions').get() as any;
    const sqliteValueCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM variable_values').get() as any;
    const sqliteKeyCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM api_keys').get() as any;
    const sqliteWebhookCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM webhooks').get() as any;

    console.log(`\n${colors.yellow}📊 Migration Summary:${colors.reset}`);
    console.log(`   Users: ${sqliteUserCount.count} migrated`);
    console.log(`   Variable Definitions: ${sqliteDefCount.count} migrated`);
    console.log(`   Variable Values: ${sqliteValueCount.count} migrated`);
    console.log(`   API Keys: ${sqliteKeyCount.count} migrated`);
    console.log(`   Webhooks: ${sqliteWebhookCount.count} migrated`);

    // Update sequences for auto-increment columns
    console.log(`\n${colors.cyan}🔧 Updating sequences...${colors.reset}`);
    const maxDefId = sqliteDb.prepare('SELECT MAX(id) as max FROM variable_definitions').get() as any;
    const maxValueId = sqliteDb.prepare('SELECT MAX(id) as max FROM variable_values').get() as any;
    const maxKeyId = sqliteDb.prepare('SELECT MAX(id) as max FROM api_keys').get() as any;
    const maxWebhookId = sqliteDb.prepare('SELECT MAX(id) as max FROM webhooks').get() as any;
    
    if (maxDefId.max) {
      sqliteDb.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'variable_definitions'`).run(maxDefId.max);
    }
    if (maxValueId.max) {
      sqliteDb.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'variable_values'`).run(maxValueId.max);
    }
    if (maxKeyId.max) {
      sqliteDb.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'api_keys'`).run(maxKeyId.max);
    }
    if (maxWebhookId.max) {
      sqliteDb.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'webhooks'`).run(maxWebhookId.max);
    }

    console.log(`   ${colors.green}✓ Sequences updated${colors.reset}`);

    console.log(`\n${colors.green}🎉 Migration completed successfully!${colors.reset}`);
    console.log(`${colors.cyan}SQLite database location:${colors.reset} ${path.join(dataDir, 'webvar.db')}`);

  } catch (error) {
    console.error(`${colors.red}❌ Migration failed:${colors.reset}`, error);
    throw error;
  } finally {
    await pgClient.end();
    sqliteDb.close();
  }
}

// Run the migration
migratePostgreSQLToSQLite().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});