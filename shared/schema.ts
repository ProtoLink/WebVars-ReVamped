import {
  pgTable,
  text,
  varchar,
  integer,
  serial,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
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
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Variable definitions table
export const variableDefinitions = pgTable("variable_definitions", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  type: varchar("type").notNull().default("string"),
  defaultValue: text("default_value"),
  enumType: varchar("enum_type"), // Legacy compatibility; string-only definitions keep this null
  ownerId: varchar("owner_id").notNull(),
  ownerType: varchar("owner_type").notNull().default("user"), // 'user', 'group', or 'unsafe'
  readPermission: varchar("read_permission").notNull().default("variable_owner"),
  writePermission: varchar("write_permission").notNull().default("variable_owner"),
  listPermission: varchar("list_permission").notNull().default("definition_owner"),
  isReadOnly: boolean("is_read_only").notNull().default(false), // When true, only creator can modify via web dashboard
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_variable_definitions_list_permission").on(table.listPermission),
  index("idx_variable_definitions_owner_list").on(table.ownerId, table.listPermission),
  index("idx_variable_definitions_updated_at").on(table.updatedAt),
]);

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
  uniqueIndex("variable_values_definition_owner_unique").on(table.definitionId, table.ownerId),
]);

// API keys table for external access
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  keyHash: varchar("key_hash").notNull().unique(),
  name: varchar("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Webhooks table for real-time notifications
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  url: varchar("url").notNull(),
  events: jsonb("events").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  secret: varchar("secret"),
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

// WebVar stores and returns every variable value as text.
export const SUPPORTED_DATA_TYPES = ['string'] as const;

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