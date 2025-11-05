import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// Session storage table for authentication
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Variable definitions table
export const variableDefinitions = sqliteTable("variable_definitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  defaultValue: text("default_value"),
  enumType: text("enum_type"), // For enum types, stores the specific enum name
  ownerId: text("owner_id").notNull(),
  ownerType: text("owner_type").notNull().default("user"), // 'user', 'group', or 'unsafe'
  readPermission: text("read_permission").notNull().default("variable_owner"),
  writePermission: text("write_permission").notNull().default("variable_owner"),
  listPermission: text("list_permission").notNull().default("definition_owner"),
  isReadOnly: integer("is_read_only", { mode: "boolean" }).notNull().default(false), // When true, only creator can modify via web dashboard
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
}, (table) => [
  index("idx_variable_definitions_list_permission").on(table.listPermission),
  index("idx_variable_definitions_owner_list").on(table.ownerId, table.listPermission),
  index("idx_variable_definitions_updated_at").on(table.updatedAt),
]);

// Variable values table
export const variableValues = sqliteTable("variable_values", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  definitionId: integer("definition_id").notNull().references(() => variableDefinitions.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(), // Can be user ID or group ID
  value: text("value").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
}, (table) => [
  index("idx_variable_values_definition_owner").on(table.definitionId, table.ownerId),
]);

// API keys table for external access
export const apiKeys = sqliteTable("api_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  keyHash: text("key_hash").notNull().unique(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastUsed: integer("last_used", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Webhooks table for real-time notifications
export const webhooks = sqliteTable("webhooks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  events: text("events").notNull(), // JSON string array of event types
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  secret: text("secret"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
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
  // Basic types
  'string',
  'bool', 'bool2', 'bool3', 'bool4',
  'char',
  'byte', 'sbyte',
  'short', 'ushort',
  'int', 'int2', 'int3', 'int4',
  'uint', 'uint2', 'uint3', 'uint4',
  'long', 'long2', 'long3', 'long4',
  'ulong', 'ulong2', 'ulong3', 'ulong4',
  'half',
  'float', 'float2', 'float3', 'float4',
  'double', 'double2', 'double3', 'double4',
  'decimal',
  
  // Matrix types
  'float2x2', 'float3x3', 'float4x4',
  'double2x2', 'double3x3', 'double4x4',
  
  // Quaternion types
  'floatQ', 'doubleQ',
  
  // Color types
  'color', 'colorX',
  
  // Time types
  'datetime', 'timespan',
  
  // Other types
  'uri', 'refID',
  
  // Enum type
  'enum'
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

// Resonite Enum Types
export const RESONITE_ENUMS = [
  'ActiveUserHandling', 'AlphaHandling', 'AntiAliasingMethod', 'AssetToolReplacementMode', 'AssetType',
  'AudioDistanceSpace', 'AudioInputType', 'AudioLoadMode', 'AudioRolloffMode', 'AudioTypeGroup', 'AvatarExpression', 'Axis',
  'Blend', 'BlendMode', 'BlockType', 'BodyNode',
  'CameraClearMode', 'CameraPositioningMode', 'CharacterControllerParameter', 'Chirality', 'CloudProfile',
  'CloudVariableChangeMode', 'ColliderType', 'ColorMask', 'ColorProfile', 'ColorProfileRequirement',
  'ComponentHandling', 'CompoundZeroHandling', 'CookiesBrowser', 'Culling', 'CurvePreset',
  'DataFeedItemChange', 'DateTimeKind', 'DayOfWeek', 'DecompositionMode', 'DependencyHandling',
  'DepthEncoding', 'DualInputHandling', 'DynamicBoneCollisionDataType',
  'ECCLevel', 'EndMode', 'Ends', 'EngineAssetClass', 'EventState', 'ExceptionAction', 'EyeSide',
  'FacetAnchorPoint', 'FilterCombineMode', 'Filtering', 'FingerSegmentType', 'FingerType',
  'HapticPositionType', 'HeadOutputDevice', 'HostAccessPermission', 'HostAccessScope', 'HttpStatusCode',
  'ImageProjection', 'InputBlockMode', 'InterpolationMode',
  'Key', 'KeyboardType', 'KeyframeInterpolation',
  'LaserHitClass', 'LayoutDirection', 'LayoutHorizontalAlignment', 'LayoutMetric', 'LayoutVerticalAlignment',
  'LegacyParticleAlignment', 'LightType', 'LineColorMode', 'ListFilterMode', 'LoadStage',
  'LocomotionArchetype', 'LocomotionReference', 'LoopSetOptions', 'LookAtUser.UserNode',
  'MappingTarget', 'MaskTextureMode', 'MaterialTag', 'MeshColliderSidedness', 'MeshEmissionSource',
  'MeshEmissionSpace', 'MessageType', 'MessageValidity', 'MigrationState', 'Model',
  'MotionVectorMode', 'MouseButton', 'MutePersistence',
  'NameplateVisibility', 'NineSliceSizing', 'NotificationType',
  'OwnerType',
  'PanoramicProjection', 'ParticleAnimationType', 'ParticleTrailMode', 'ParticleTrailTextureMode',
  'PBR_TextureFormat', 'PermissionState', 'PermissionViolationAction', 'PhotoEncodeFormat',
  'PhysicsScalingMode', 'Platform', 'PlaybackAction', 'PointerType', 'PointProjection',
  'PositionType', 'PrimaryLocomotionController', 'Primitive', 'Priority', 'ProgressStage', 'PropertyState',
  'ReferenceState', 'Relation', 'RenderingContext', 'RestoreMode', 'RootSpace',
  'SampleRateMode', 'SaveType', 'ScaleMultiplierMode', 'ScreenshotType', 'SensationClass',
  'SessionAccessLevel', 'Shading', 'ShadowCascadeMode', 'ShadowCastMode', 'ShadowResolutionMode',
  'ShadowType', 'ShoulderRotationMode', 'SidewaysMovementMode', 'SimulationType', 'SizeFit',
  'SkinnedBounds', 'SkinWeightMode', 'StaticCameraType', 'SteamChannel', 'SteamCloseReason',
  'StencilComparison', 'StencilOperation', 'StereoLayout', 'StringComparison',
  'TextureCompression', 'TextureConversion', 'TextureFilterMode', 'TextureFormat', 'TextureSizeLimit',
  'TextureSizeRatio', 'TorsoSide', 'TouchEventType', 'TouchType', 'TrackType',
  'UnlitTextureMode', 'UserRoot.UserNode',
  'ValueEncoding', 'ValueSpatialVariableMode', 'VibratePreset', 'Viseme', 'VoiceMode',
  'VolumeMeterMethod', 'VolumePlaneMode',
  'Winding', 'WireType', 'WorldIdLinkStatus', 'WrapMode',
  'ZTest', 'ZWrite'
] as const;

export type DataType = typeof SUPPORTED_DATA_TYPES[number];
export type PermissionType = typeof PERMISSION_TYPES[number];
export type ResoniteEnum = typeof RESONITE_ENUMS[number];