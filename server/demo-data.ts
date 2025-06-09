import { storage } from "./storage";

export async function createDemoData(userId: string) {
  // Create sample variable definitions from various mock users
  // Mix of global and private variables with different read-only statuses
  const demoVariables = [
    // Global variables from different creators
    {
      name: "Player.Score",
      type: "string",
      defaultValue: "1500",
      ownerId: "GameMaster_Alex",
      ownerType: "user",
      readPermission: "anyone",
      writePermission: "variable_owner", 
      listPermission: "anyone",
      isReadOnly: true
    },
    {
      name: "Server.MaxPlayers",
      type: "string",
      defaultValue: "32",
      ownerId: "ServerAdmin_Sarah",
      ownerType: "user",
      readPermission: "anyone",
      writePermission: "variable_owner",
      listPermission: "anyone",
      isReadOnly: true
    },
    {
      name: "World.Gravity",
      type: "string",
      defaultValue: "9.81",
      ownerId: "WorldBuilder_Mike",
      ownerType: "user",
      readPermission: "anyone",
      writePermission: "variable_owner",
      listPermission: "anyone",
      isReadOnly: false
    },
    {
      name: "Event.Christmas2024",
      type: "string",
      defaultValue: "active",
      ownerId: "EventManager_Luna",
      ownerType: "user", 
      readPermission: "anyone",
      writePermission: "variable_owner",
      listPermission: "anyone",
      isReadOnly: true
    },
    {
      name: "Weather.System",
      type: "string",
      defaultValue: "sunny",
      ownerId: "WeatherBot_Auto",
      ownerType: "user",
      readPermission: "anyone",
      writePermission: "variable_owner",
      listPermission: "anyone",
      isReadOnly: false
    },
    {
      name: "Economy.ExchangeRate",
      type: "string",
      defaultValue: "1.25",
      ownerId: "EconomyManager_Dev",
      ownerType: "user",
      readPermission: "anyone",
      writePermission: "variable_owner",
      listPermission: "anyone",
      isReadOnly: true
    },
    // Private variables from different users
    {
      name: "CrafterJoe.Blueprint",
      type: "string",
      defaultValue: "secret_recipe_v2",
      ownerId: "CrafterJoe",
      ownerType: "user",
      readPermission: "definition_owner",
      writePermission: "definition_owner",
      listPermission: "definition_owner",
      isReadOnly: false
    },
    {
      name: "BuilderSam.ProjectData",
      type: "string",
      defaultValue: '{"walls":45,"floors":12,"furniture":89}',
      ownerId: "BuilderSam",
      ownerType: "user",
      readPermission: "definition_owner",
      writePermission: "definition_owner",
      listPermission: "definition_owner",
      isReadOnly: true
    },
    {
      name: "ArtistZoe.Gallery",
      type: "string",
      defaultValue: '["painting1","sculpture2","digital3"]',
      ownerId: "ArtistZoe",
      ownerType: "user",
      readPermission: "definition_owner",
      writePermission: "definition_owner",
      listPermission: "definition_owner",
      isReadOnly: false
    },
    {
      name: "MusicianMax.Playlist",
      type: "string",
      defaultValue: "jazz_collection_2024",
      ownerId: "MusicianMax",
      ownerType: "user",
      readPermission: "definition_owner",
      writePermission: "definition_owner",
      listPermission: "definition_owner",
      isReadOnly: true
    },
    // Current user's private variables
    {
      name: `${userId}.PersonalNotes`,
      type: "string",
      defaultValue: "My private workspace notes",
      ownerId: userId,
      ownerType: "user",
      readPermission: "definition_owner",
      writePermission: "definition_owner",
      listPermission: "definition_owner",
      isReadOnly: false
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
      console.log(`Created demo variable: ${variable.name} (${variable.listPermission === "anyone" ? "global" : "private"}) - ReadOnly: ${variable.isReadOnly}`);
      
      // Create initial values
      const definition = await storage.getVariableDefinition(variable.name);
      if (definition) {
        let initialValue = variable.defaultValue;
        
        // For global variables, create creator values and some user values
        if (variable.listPermission === "anyone") {
          // Create creator's value first
          await storage.setVariableValue({
            definitionId: definition.id,
            ownerId: variable.ownerId,
            value: initialValue
          });
          
          // For non-read-only variables, create user-specific values
          if (!variable.isReadOnly) {
            if (variable.name === "Player.Score") {
              initialValue = Math.floor(Math.random() * 3000 + 1000).toString();
            } else if (variable.name === "World.Gravity") {
              initialValue = (Math.random() * 2 + 8).toFixed(2);
            } else if (variable.name === "Weather.System") {
              const weather = ["sunny", "rainy", "cloudy", "snowy"];
              initialValue = weather[Math.floor(Math.random() * weather.length)];
            }
            
            await storage.setVariableValue({
              definitionId: definition.id,
              ownerId: userId,
              value: initialValue
            });
          }
        } else {
          // For private variables, only create value if current user is owner
          if (variable.ownerId === userId) {
            await storage.setVariableValue({
              definitionId: definition.id,
              ownerId: userId,
              value: initialValue
            });
          }
        }
        console.log(`Created values for ${variable.name}`);
      }
    } catch (error) {
      console.error(`Error creating demo variable ${variable.name}:`, error);
    }
  }

  console.log(`Demo data creation completed for user ${userId}`);
}