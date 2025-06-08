import { storage } from "./storage";

export async function createDemoData(userId: string) {
  // Create sample variable definitions that showcase different use cases
  const demoVariables = [
    {
      name: `${userId}_player_score`,
      type: "string",
      defaultValue: "1500",
      ownerId: userId,
      ownerType: "user",
      readPermission: "variable_owner",
      writePermission: "variable_owner", 
      listPermission: "definition_owner"
    },
    {
      name: `${userId}_game_settings`,
      type: "string",
      defaultValue: '{"difficulty":"normal","volume":0.8}',
      ownerId: userId,
      ownerType: "user",
      readPermission: "variable_owner",
      writePermission: "variable_owner",
      listPermission: "definition_owner"
    },
    {
      name: `${userId}_is_online`,
      type: "string",
      defaultValue: "true",
      ownerId: userId,
      ownerType: "user", 
      readPermission: "variable_owner",
      writePermission: "variable_owner",
      listPermission: "definition_owner"
    },
    {
      name: `${userId}_avatar_height`,
      type: "string",
      defaultValue: "1.75",
      ownerId: userId,
      ownerType: "user",
      readPermission: "variable_owner",
      writePermission: "variable_owner",
      listPermission: "definition_owner"
    },
    {
      name: `${userId}_world_preferences`,
      type: "string",
      defaultValue: '{"theme":"cyberpunk","lighting":"dynamic"}',
      ownerId: userId,
      ownerType: "user",
      readPermission: "variable_owner",
      writePermission: "variable_owner",
      listPermission: "definition_owner"
    }
  ];

  // Create the variable definitions
  for (const variable of demoVariables) {
    try {
      // Check if variable already exists
      const existing = await storage.getVariableDefinition(variable.name);
      if (existing) {
        console.log(`Demo variable ${variable.name} already exists, skipping...`);
        continue;
      }
      
      await storage.createVariableDefinition(variable);
      console.log(`Created demo variable: ${variable.name}`);
      
      // Create initial values for some variables
      if (variable.name === `${userId}_player_score`) {
        const definition = await storage.getVariableDefinition(variable.name);
        if (definition) {
          await storage.setVariableValue({
            definitionId: definition.id,
            ownerId: userId,
            value: "2100"
          });
        }
      }
      
      if (variable.name === `${userId}_is_online`) {
        const definition = await storage.getVariableDefinition(variable.name);
        if (definition) {
          await storage.setVariableValue({
            definitionId: definition.id,
            ownerId: userId,
            value: "true"
          });
        }
      }
    } catch (error) {
      console.error(`Error creating demo variable ${variable.name}:`, error);
    }
  }

  console.log(`Demo data creation completed for user ${userId}`);
}