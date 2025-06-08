import {
  users,
  variableDefinitions,
  variableValues,
  apiKeys,
  webhooks,
  type User,
  type UpsertUser,
  type VariableDefinition,
  type InsertVariableDefinition,
  type UpdateVariableDefinition,
  type VariableValue,
  type InsertVariableValue,
  type UpdateVariableValue,
  type ApiKey,
  type InsertApiKey,
  type Webhook,
  type InsertWebhook,
  type UpdateWebhook,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, count } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByCredentials(username: string, password: string): Promise<User | undefined>;
  createUser(username: string, password: string): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Variable definition operations
  getVariableDefinition(name: string): Promise<VariableDefinition | undefined>;
  getVariableDefinitions(ownerId?: string): Promise<VariableDefinition[]>;
  createVariableDefinition(definition: InsertVariableDefinition): Promise<VariableDefinition>;
  updateVariableDefinition(id: number, updates: UpdateVariableDefinition): Promise<VariableDefinition>;
  deleteVariableDefinition(id: number): Promise<void>;

  // Variable value operations
  getVariableValue(definitionId: number, ownerId: string): Promise<VariableValue | undefined>;
  getVariableValues(definitionId: number): Promise<VariableValue[]>;
  setVariableValue(value: InsertVariableValue): Promise<VariableValue>;
  updateVariableValue(id: number, updates: UpdateVariableValue): Promise<VariableValue>;
  deleteVariableValue(id: number): Promise<void>;

  // API key operations
  createApiKey(apiKey: InsertApiKey): Promise<{ key: string; apiKey: ApiKey }>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  getUserApiKeys(userId: string): Promise<ApiKey[]>;
  updateApiKeyLastUsed(id: number): Promise<void>;
  deleteApiKey(id: number): Promise<void>;

  // Webhook operations
  createWebhook(webhook: InsertWebhook): Promise<Webhook>;
  getWebhooks(userId: string): Promise<Webhook[]>;
  updateWebhook(id: number, updates: UpdateWebhook): Promise<Webhook>;
  deleteWebhook(id: number): Promise<void>;
  getActiveWebhooksForUser(userId: string): Promise<Webhook[]>;

  // Statistics
  getStats(userId: string): Promise<{
    totalVariables: number;
    totalValues: number;
    globalVariables: number;
    privateVariables: number;
    apiRequestsToday: number;
    activeUsers: number;
  }>;

  // Search
  searchVariableDefinitions(query: string, ownerId?: string): Promise<VariableDefinition[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByCredentials(username: string, password: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, username));
    if (!user) return undefined;
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : undefined;
  }

  async createUser(username: string, password: string): Promise<User> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const [user] = await db
      .insert(users)
      .values({
        id: username,
        email: `${username}@example.com`,
        passwordHash,
        firstName: username,
        lastName: '',
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error: any) {
      if (error.code === '23505' && error.constraint === 'users_email_unique') {
        const existingUser = await this.getUser(userData.id);
        if (existingUser) {
          return existingUser;
        }
      }
      throw error;
    }
  }

  // Variable definition operations
  async getVariableDefinition(name: string): Promise<VariableDefinition | undefined> {
    const [definition] = await db
      .select()
      .from(variableDefinitions)
      .where(eq(variableDefinitions.name, name));
    return definition;
  }

  async getVariableDefinitions(ownerId?: string): Promise<VariableDefinition[]> {
    const query = db.select().from(variableDefinitions);
    
    if (ownerId) {
      return await query.where(eq(variableDefinitions.ownerId, ownerId));
    }
    
    return await query.orderBy(desc(variableDefinitions.updatedAt));
  }

  async createVariableDefinition(definition: InsertVariableDefinition): Promise<VariableDefinition> {
    const [created] = await db
      .insert(variableDefinitions)
      .values(definition)
      .returning();
    return created;
  }

  async updateVariableDefinition(id: number, updates: UpdateVariableDefinition): Promise<VariableDefinition> {
    const [updated] = await db
      .update(variableDefinitions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(variableDefinitions.id, id))
      .returning();
    return updated;
  }

  async deleteVariableDefinition(id: number): Promise<void> {
    await db.delete(variableDefinitions).where(eq(variableDefinitions.id, id));
  }

  // Variable value operations
  async getVariableValue(definitionId: number, ownerId: string): Promise<VariableValue | undefined> {
    const [value] = await db
      .select()
      .from(variableValues)
      .where(and(
        eq(variableValues.definitionId, definitionId),
        eq(variableValues.ownerId, ownerId)
      ));
    return value;
  }

  async getVariableValues(definitionId: number): Promise<VariableValue[]> {
    return await db
      .select()
      .from(variableValues)
      .where(eq(variableValues.definitionId, definitionId))
      .orderBy(desc(variableValues.updatedAt));
  }

  async setVariableValue(value: InsertVariableValue): Promise<VariableValue> {
    const existing = await this.getVariableValue(value.definitionId, value.ownerId);
    
    if (existing) {
      const [updated] = await db
        .update(variableValues)
        .set({ value: value.value, updatedAt: new Date() })
        .where(eq(variableValues.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(variableValues)
        .values(value)
        .returning();
      return created;
    }
  }

  async updateVariableValue(id: number, updates: UpdateVariableValue): Promise<VariableValue> {
    const [updated] = await db
      .update(variableValues)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(variableValues.id, id))
      .returning();
    return updated;
  }

  async deleteVariableValue(id: number): Promise<void> {
    await db.delete(variableValues).where(eq(variableValues.id, id));
  }

  // API key operations
  async createApiKey(apiKeyData: InsertApiKey): Promise<{ key: string; apiKey: ApiKey }> {
    const key = `wv_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    
    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        ...apiKeyData,
        keyHash,
      })
      .returning();
    
    return { key, apiKey };
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.isActive, true)
      ));
    return apiKey;
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  }

  async updateApiKeyLastUsed(id: number): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async deleteApiKey(id: number): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  // Webhook operations
  async createWebhook(webhook: InsertWebhook): Promise<Webhook> {
    const [created] = await db
      .insert(webhooks)
      .values(webhook)
      .returning();
    return created;
  }

  async getWebhooks(userId: string): Promise<Webhook[]> {
    return await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.userId, userId))
      .orderBy(desc(webhooks.createdAt));
  }

  async updateWebhook(id: number, updates: UpdateWebhook): Promise<Webhook> {
    const [updated] = await db
      .update(webhooks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(webhooks.id, id))
      .returning();
    return updated;
  }

  async deleteWebhook(id: number): Promise<void> {
    await db.delete(webhooks).where(eq(webhooks.id, id));
  }

  async getActiveWebhooksForUser(userId: string): Promise<Webhook[]> {
    return await db
      .select()
      .from(webhooks)
      .where(and(
        eq(webhooks.userId, userId),
        eq(webhooks.isActive, true)
      ));
  }

  // Statistics
  async getStats(userId: string): Promise<{
    totalVariables: number;
    totalValues: number;
    globalVariables: number;
    privateVariables: number;
    apiRequestsToday: number;
    activeUsers: number;
  }> {
    // Get all definitions visible to user (same logic as the definitions endpoint)
    const allDefinitions = await this.getVariableDefinitions();
    
    const visibleDefinitions = allDefinitions.filter(def => {
      // Global variables with "anyone" list permission (visible to all)
      if (def.listPermission === "anyone") {
        return true;
      }
      // User's own private variables
      if (def.ownerId === userId && def.listPermission === "definition_owner") {
        return true;
      }
      return false;
    });

    // Count global and private variables separately
    const globalVariables = allDefinitions.filter(def => def.listPermission === "anyone");
    const privateVariables = allDefinitions.filter(def => 
      def.ownerId === userId && def.listPermission === "definition_owner"
    );

    // Get total values for global variables
    let totalGlobalValues = 0;
    for (const def of globalVariables) {
      const values = await this.getVariableValues(def.id);
      totalGlobalValues += values.length;
    }

    return {
      totalVariables: visibleDefinitions.length,
      totalValues: totalGlobalValues,
      globalVariables: globalVariables.length,
      privateVariables: privateVariables.length,
      apiRequestsToday: 0, // Would need request logging to implement
      activeUsers: 1, // Simplified for now
    };
  }

  // Search
  async searchVariableDefinitions(query: string, ownerId?: string): Promise<VariableDefinition[]> {
    if (ownerId) {
      return await db
        .select()
        .from(variableDefinitions)
        .where(and(
          like(variableDefinitions.name, `%${query}%`),
          eq(variableDefinitions.ownerId, ownerId)
        ))
        .orderBy(desc(variableDefinitions.updatedAt));
    }

    return await db
      .select()
      .from(variableDefinitions)
      .where(like(variableDefinitions.name, `%${query}%`))
      .orderBy(desc(variableDefinitions.updatedAt));
  }
}

export const storage = new DatabaseStorage();
