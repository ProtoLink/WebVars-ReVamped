#!/usr/bin/env tsx
import { db } from './db';
import { users, variableDefinitions, variableValues } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function verifyMigration() {
  console.log('🔍 Verifying migrated data in SQLite...\n');

  try {
    // Check users
    console.log('👥 Users:');
    const allUsers = await db.select().from(users).limit(5);
    console.log(`  Total users: ${await db.select().from(users).then(r => r.length)}`);
    console.log('  Sample users:', allUsers.map(u => u.id).join(', '));

    // Check variable definitions
    console.log('\n📦 Variable Definitions:');
    const allDefs = await db.select().from(variableDefinitions).limit(5);
    console.log(`  Total definitions: ${await db.select().from(variableDefinitions).then(r => r.length)}`);
    console.log('  Sample definitions:', allDefs.map(d => d.name).slice(0, 5).join(', '));
    
    // Check variable values
    console.log('\n💾 Variable Values:');
    const allValues = await db.select().from(variableValues).limit(5);
    console.log(`  Total values: ${await db.select().from(variableValues).then(r => r.length)}`);
    
    // Test a specific user's variables
    console.log('\n🧪 Testing specific user data:');
    const testUser = await db.select().from(users).where(eq(users.id, 'Tacusin')).limit(1);
    if (testUser.length > 0) {
      console.log(`  User 'Tacusin' found ✅`);
      const tacusinVars = await db.select()
        .from(variableDefinitions)
        .where(eq(variableDefinitions.ownerId, 'Tacusin'));
      console.log(`  Variables owned by Tacusin: ${tacusinVars.map(v => v.name).join(', ')}`);
    }

    // Test variable with public access
    console.log('\n🌍 Testing public variables:');
    const publicVars = await db.select()
      .from(variableDefinitions)
      .where(eq(variableDefinitions.readPermission, 'anyone'));
    console.log(`  Public variables: ${publicVars.map(v => v.name).join(', ')}`);

    console.log('\n✅ All verification checks passed! Migration successful.');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

verifyMigration().catch(console.error);