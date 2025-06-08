import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Variable definitions table
export const variableDefinitions = pgTable("variable_definitions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(),
  defaultValue: text("default_value"),
  ownerId: varchar("owner_id").notNull(),
  ownerType: varchar("owner_type", { length: 10 }).notNull().default("user"), // 'user', 'group', or 'unsafe'
  readPermission: varchar("read_permission", { length: 50 }).notNull().default("variable_owner"),
  writePermission: varchar("write_permission", { length: 50 }).notNull().default("variable_owner"),
  listPermission: varchar("list_permission", { length: 50 }).notNull().default("definition_owner"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Variable values table
export const variableValues = pgTable("variable_values", {
  id: serial("id").primaryKey(),
  definitionId: integer("definition_id").notNull().references(() => variableDefinitions.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").notNull(), // Can be user ID or group ID
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_variable_values_definition_owner").on(table.definitionId, table.ownerId),
]);

// API keys table for external access
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  keyHash: varchar("key_hash", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Webhooks table for real-time notifications
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  url: varchar("url", { length: 500 }).notNull(),
  events: jsonb("events").notNull(), // Array of event types
  isActive: boolean("is_active").notNull().default(true),
  secret: varchar("secret", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  variableDefinitions: many(variableDefinitions),
  apiKeys: many(apiKeys),
  webhooks: many(webhooks),
}));

export const variableDefinitionsRelations = relations(variableDefinitions, ({ one, many }) => ({
  owner: one(users, {
    fields: [variableDefinitions.ownerId],
    references: [users.id],
  }),
  values: many(variableValues),
}));

export const variableValuesRelations = relations(variableValues, ({ one }) => ({
  definition: one(variableDefinitions, {
    fields: [variableValues.definitionId],
    references: [variableDefinitions.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const webhooksRelations = relations(webhooks, ({ one }) => ({
  user: one(users, {
    fields: [webhooks.userId],
    references: [users.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertVariableDefinitionSchema = createInsertSchema(variableDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVariableValueSchema = createInsertSchema(variableValues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  keyHash: true,
  lastUsed: true,
  createdAt: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update schemas
export const updateVariableDefinitionSchema = insertVariableDefinitionSchema.partial();
export const updateVariableValueSchema = insertVariableValueSchema.partial();
export const updateWebhookSchema = insertWebhookSchema.partial();

// Type exports
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type VariableDefinition = typeof variableDefinitions.$inferSelect;
export type InsertVariableDefinition = z.infer<typeof insertVariableDefinitionSchema>;
export type UpdateVariableDefinition = z.infer<typeof updateVariableDefinitionSchema>;
export type VariableValue = typeof variableValues.$inferSelect;
export type InsertVariableValue = z.infer<typeof insertVariableValueSchema>;
export type UpdateVariableValue = z.infer<typeof updateVariableValueSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type UpdateWebhook = z.infer<typeof updateWebhookSchema>;

// Supported data types (from Resonite)
export const SUPPORTED_DATA_TYPES = [
  'bool', 'bool2', 'bool3', 'bool4',
  'float', 'float2', 'float3', 'float4', 'float2x2', 'float3x3', 'float4x4',
  'int', 'int2', 'int3', 'int4',
  'long', 'long2', 'long3', 'long4',
  'double', 'double2', 'double3', 'double4', 'double2x2', 'double3x3', 'double4x4',
  'uint', 'uint2', 'uint3', 'uint4',
  'ulong', 'ulong2', 'ulong3', 'ulong4',
  'short', 'ushort',
  'byte', 'sbyte',
  'floatq', 'doubleq',
  'color', 'datetime', 'timespan', 'decimal',
  'string', 'enum'
] as const;

// Permission types
export const PERMISSION_TYPES = [
  'anyone',
  'definition_owner_only',
  'definition_owner_only_unsafe',
  'variable_owner',
  'variable_owner_unsafe',
  'definition_owner_only_contacts',
  'definition_owner_only_contacts_unsafe',
  'variable_owner_only_contacts',
  'variable_owner_only_contacts_unsafe',
  'definition_owner',
  'definition_owner_unsafe'
] as const;

export type DataType = typeof SUPPORTED_DATA_TYPES[number];
export type PermissionType = typeof PERMISSION_TYPES[number];
