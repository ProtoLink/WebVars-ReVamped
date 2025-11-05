#!/usr/bin/env tsx
import { db } from './db';
import { storage } from './storage';
import { users, variableDefinitions, variableValues } from '../shared/schema';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function testSQLiteIntegration() {
  console.log('🧪 Testing SQLite Integration...\n');

  try {
    // Test 1: Create a user
    console.log('1️⃣ Testing user creation...');
    const userId = 'test_' + crypto.randomBytes(4).toString('hex');
    const passwordHash = await bcrypt.hash('testpassword', 10);
    
    const user = await storage.upsertUser({
      id: userId,
      email: `${userId}@test.com`,
      passwordHash,
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('✅ User created:', user.id);

    // Test 2: Create a variable definition
    console.log('\n2️⃣ Testing variable definition creation...');
    const varDef = await storage.createVariableDefinition({
      name: `test.var.${Date.now()}`,
      type: 'string',
      defaultValue: 'default',
      ownerId: userId,
      ownerType: 'user',
      readPermission: 'anyone',
      writePermission: 'anyone',
      listPermission: 'anyone',
      isReadOnly: false
    });
    console.log('✅ Variable definition created:', varDef.name);

    // Test 3: Set a variable value
    console.log('\n3️⃣ Testing variable value setting...');
    const value = await storage.setVariableValue({
      definitionId: varDef.id,
      ownerId: userId,
      value: 'test_value_123'
    });
    console.log('✅ Variable value set:', value.value);

    // Test 4: Retrieve the variable value
    console.log('\n4️⃣ Testing variable value retrieval...');
    const retrievedValue = await storage.getVariableValue(varDef.id, userId);
    console.log('✅ Variable value retrieved:', retrievedValue?.value);

    // Test 5: Test anonymous user access
    console.log('\n5️⃣ Testing anonymous user access...');
    const anonUserId = 'anon_' + crypto.randomBytes(4).toString('hex');
    const anonValue = await storage.setVariableValue({
      definitionId: varDef.id,
      ownerId: anonUserId,
      value: 'anonymous_value'
    });
    console.log('✅ Anonymous value set:', anonValue.value);

    // Test 6: List all variable definitions
    console.log('\n6️⃣ Testing variable definitions listing...');
    const allDefs = await storage.getVariableDefinitions();
    console.log('✅ Found', allDefs.length, 'variable definitions');

    // Test 7: Test API key creation
    console.log('\n7️⃣ Testing API key creation...');
    const apiKeyResult = await storage.createApiKey({
      userId: userId,
      name: 'Test API Key',
      isActive: true
    });
    console.log('✅ API key created:', apiKeyResult.key.substring(0, 10) + '...');

    // Test 8: Test webhook creation
    console.log('\n8️⃣ Testing webhook creation...');
    const webhook = await storage.createWebhook({
      userId: userId,
      url: 'https://example.com/webhook',
      events: JSON.stringify(['variable.created', 'variable.updated']),
      isActive: true,
      secret: crypto.randomBytes(32).toString('hex')
    });
    console.log('✅ Webhook created:', webhook.url);

    // Test 9: Get statistics
    console.log('\n9️⃣ Testing statistics...');
    const stats = await storage.getStats(userId);
    console.log('✅ Statistics retrieved:');
    console.log('   Total variables:', stats.totalVariables);
    console.log('   Total values:', stats.totalValues);
    console.log('   Global variables:', stats.globalVariables);

    // Test 10: Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await storage.deleteVariableDefinition(varDef.id);
    await storage.deleteApiKey(apiKeyResult.apiKey.id);
    await storage.deleteWebhook(webhook.id);
    
    // Delete user
    await db.delete(users).where(eq(users.id, userId));
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! SQLite integration is working correctly.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testSQLiteIntegration();