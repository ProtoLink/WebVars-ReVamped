import { storage } from "./storage";

export async function createDemoData(userId: string) {
  // Create sample variable definitions following Resonite cloud variable patterns
  // These represent global variable definitions that all users can access with their own values
  const demoVariables = [
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
    {
      name: "World.Preferences",
      type: "string",
      defaultValue: '{"theme":"cyberpunk","lighting":"dynamic"}',
      ownerId: "system",
      ownerType: "user",
      readPermission: "anyone",
      writePermission: "variable_owner",
      listPermission: "anyone"
    }
  ];

  // Create the variable definitions (global, shared by all users)
  for (const variable of demoVariables) {
    try {
      // Check if variable already exists
      const existing = await storage.getVariableDefinition(variable.name);
      if (existing) {
        console.log(`Demo variable ${variable.name} already exists, creating user value...`);
      } else {
        await storage.createVariableDefinition(variable);
        console.log(`Created demo variable: ${variable.name}`);
      }
      
      // Create user-specific values for this requesting user
      const definition = await storage.getVariableDefinition(variable.name);
      if (definition) {
        // Check if user already has a value for this variable
        const existingValue = await storage.getVariableValue(definition.id, userId);
        if (!existingValue) {
          // Set initial values based on variable type
          let initialValue = variable.defaultValue;
          
          if (variable.name === "Player.Score") {
            initialValue = "2100";
          } else if (variable.name === "User.IsOnline") {
            initialValue = "true";
          } else if (variable.name === "Avatar.Height") {
            initialValue = Math.random() > 0.5 ? "1.8" : "1.7"; // Some variety
          }
          
          await storage.setVariableValue({
            definitionId: definition.id,
            ownerId: userId,
            value: initialValue
          });
          console.log(`Created value for ${variable.name} for user ${userId}`);
        } else {
          console.log(`User ${userId} already has value for ${variable.name}`);
        }
      }
    } catch (error) {
      console.error(`Error creating demo variable ${variable.name}:`, error);
    }
  }

  console.log(`Demo data creation completed for user ${userId}`);
}