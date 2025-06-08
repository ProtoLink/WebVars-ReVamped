import { storage } from "./storage";

export async function createDemoData(userId: string) {
  // Create sample variable definitions that showcase different use cases
  const demoVariables = [
    {
      name: "player_score",
      type: "int",
      defaultValue: "1500",
      ownerId: userId,
      ownerType: "user",
      readPermission: "public",
      writePermission: "owner", 
      listPermission: "public"
    },
    {
      name: "game_settings",
      type: "string",
      defaultValue: '{"difficulty":"normal","volume":0.8}',
      ownerId: userId,
      ownerType: "user",
      readPermission: "friends",
      writePermission: "owner",
      listPermission: "friends"
    },
    {
      name: "is_online",
      type: "bool",
      defaultValue: "true",
      ownerId: userId,
      ownerType: "user", 
      readPermission: "public",
      writePermission: "owner",
      listPermission: "public"
    },
    {
      name: "avatar_height",
      type: "float",
      defaultValue: "1.75",
      ownerId: userId,
      ownerType: "user",
      readPermission: "public",
      writePermission: "owner",
      listPermission: "public"
    },
    {
      name: "world_preferences",
      type: "string",
      defaultValue: '{"theme":"cyberpunk","lighting":"dynamic"}',
      ownerId: userId,
      ownerType: "user",
      readPermission: "private",
      writePermission: "owner",
      listPermission: "private"
    },
    {
      name: "avatar_color",
      type: "color",
      defaultValue: "#4A90E2",
      ownerId: userId,
      ownerType: "user",
      readPermission: "public",
      writePermission: "owner",
      listPermission: "public"
    },
    {
      name: "player_position",
      type: "float3",
      defaultValue: "0.0,1.75,0.0",
      ownerId: userId,
      ownerType: "user",
      readPermission: "public",
      writePermission: "owner",
      listPermission: "public"
    },
    {
      name: "ui_anchor_point",
      type: "float2",
      defaultValue: "0.5,0.5",
      ownerId: userId,
      ownerType: "user",
      readPermission: "public",
      writePermission: "owner",
      listPermission: "public"
    }
  ];

  // Create the variable definitions
  for (const variable of demoVariables) {
    try {
      await storage.createVariableDefinition(variable);
      
      // Create initial values for some variables
      if (variable.name === "player_score") {
        await storage.setVariableValue({
          definitionId: (await storage.getVariableDefinition(variable.name))!.id,
          ownerId: userId,
          value: "2100"
        });
      }
      
      if (variable.name === "is_online") {
        await storage.setVariableValue({
          definitionId: (await storage.getVariableDefinition(variable.name))!.id,
          ownerId: userId,
          value: "true"
        });
      }
    } catch (error) {
      console.log(`Demo variable ${variable.name} may already exist, skipping...`);
    }
  }

  console.log(`Created demo data for user ${userId}`);
}