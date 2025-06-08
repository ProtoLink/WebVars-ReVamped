import { storage } from "./storage";

export async function createDemoData(userId: string) {
  // Create sample variable definitions following Resonite cloud variable patterns
  // Mix of global (system-owned) and private (user-owned) variables
  const demoVariables = [
    // Global variables (system-owned, accessible to all users)
    {
      name: "Player.Score",
      type: "string",
      defaultValue: "1500",
      ownerId: "system",
      ownerType: "user",
      readPermission: "anyone",
      writePermission: "variable_owner", 
      listPermission: "anyone"
    },
    {
      name: "Game.Settings",
      type: "string",
      defaultValue: '{"difficulty":"normal","volume":0.8}',
      ownerId: "system",
      ownerType: "user",
      readPermission: "anyone",
      writePermission: "variable_owner",
      listPermission: "anyone"
    },
    {
      name: "User.IsOnline",
      type: "string",
      defaultValue: "false",
      ownerId: "system",
      ownerType: "user", 
      readPermission: "anyone",
      writePermission: "variable_owner",
      listPermission: "anyone"
    },
    {
      name: "Avatar.Height",
      type: "string",
      defaultValue: "1.75",
      ownerId: "system",
      ownerType: "user",
      readPermission: "anyone",
      writePermission: "variable_owner",
      listPermission: "anyone"
    },
    // Private variables (user-owned, only visible to owner)
    {
      name: `${userId}.PrivateNotes`,
      type: "string",
      defaultValue: "My private notes...",
      ownerId: userId,
      ownerType: "user",
      readPermission: "definition_owner",
      writePermission: "definition_owner",
      listPermission: "definition_owner"
    },
    {
      name: `${userId}.SecretConfig`,
      type: "string",
      defaultValue: '{"apiKey":"hidden","personalSettings":true}',
      ownerId: userId,
      ownerType: "user",
      readPermission: "definition_owner",
      writePermission: "definition_owner",
      listPermission: "definition_owner"
    },
    {
      name: `${userId}.Inventory`,
      type: "string",
      defaultValue: '["sword","potion","map"]',
      ownerId: userId,
      ownerType: "user",
      readPermission: "definition_owner",
      writePermission: "definition_owner",
      listPermission: "definition_owner"
    }
  ];

  // Create the variable definitions (mix of global and private)
  for (const variable of demoVariables) {
    try {
      // Check if variable already exists
      const existing = await storage.getVariableDefinition(variable.name);
      if (existing) {
        console.log(`Demo variable ${variable.name} already exists`);
        
        // For global variables, still create user value if they don't have one
        if (variable.ownerId === "system") {
          const existingValue = await storage.getVariableValue(existing.id, userId);
          if (!existingValue) {
            let initialValue = variable.defaultValue;
            if (variable.name === "Player.Score") {
              initialValue = "2100";
            } else if (variable.name === "User.IsOnline") {
              initialValue = "true";
            } else if (variable.name === "Avatar.Height") {
              initialValue = Math.random() > 0.5 ? "1.8" : "1.7";
            }
            
            await storage.setVariableValue({
              definitionId: existing.id,
              ownerId: userId,
              value: initialValue
            });
            console.log(`Created value for existing global variable ${variable.name} for user ${userId}`);
          }
        }
        continue;
      }
      
      await storage.createVariableDefinition(variable);
      console.log(`Created demo variable: ${variable.name} (${variable.ownerId === "system" ? "global" : "private"})`);
      
      // Create initial values
      const definition = await storage.getVariableDefinition(variable.name);
      if (definition) {
        let initialValue = variable.defaultValue;
        
        // For global variables, create user-specific values
        if (variable.ownerId === "system") {
          if (variable.name === "Player.Score") {
            initialValue = "2100";
          } else if (variable.name === "User.IsOnline") {
            initialValue = "true";
          } else if (variable.name === "Avatar.Height") {
            initialValue = Math.random() > 0.5 ? "1.8" : "1.7";
          }
        }
        // For private variables, the owner is the same as the value owner
        
        await storage.setVariableValue({
          definitionId: definition.id,
          ownerId: userId,
          value: initialValue
        });
        console.log(`Created value for ${variable.name} for user ${userId}`);
      }
    } catch (error) {
      console.error(`Error creating demo variable ${variable.name}:`, error);
    }
  }

  console.log(`Demo data creation completed for user ${userId}`);
}