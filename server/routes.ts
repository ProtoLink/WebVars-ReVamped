import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertVariableDefinitionSchema, insertVariableValueSchema, insertWebhookSchema, SUPPORTED_DATA_TYPES, PERMISSION_TYPES } from "@shared/schema";
import { getEnumValues } from "@shared/resonite-enums";

// Helper functions for enum conversion
function convertEnumNameToIndex(enumType: string, enumName: string): number {
  const enumValues = getEnumValues(enumType as any);
  const index = enumValues.indexOf(enumName);
  return index >= 0 ? index : 0; // Default to 0 if not found
}

function convertEnumIndexToName(enumType: string, enumIndex: number): string {
  const enumValues = getEnumValues(enumType as any);
  return enumValues[enumIndex] || enumValues[0] || ''; // Default to first value if index out of bounds
}

function isNumericString(str: string): boolean {
  return /^\d+$/.test(str.trim());
}
import { z } from "zod";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many API requests from this IP",
});

const variableLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 variable operations per minute
  message: "Too many variable operations from this IP",
});

// WebSocket connection tracking
const wsConnections = new Map<string, WebSocket>();

// Middleware to extract userId from session or URL parameter
const extractUserId = async (req: any, res: any, next: any) => {
  // Try session first, then query parameter for API compatibility
  const userId = req.session?.userId || req.query.userId as string;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  
  try {
    // Check if user exists in database
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please log in or sign up.' });
    }
    req.userId = userId;
    req.user = user;
    next();
  } catch (error) {
    console.error('User authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Helper function to get variable definition
const getVariableDefinition = async (name: string) => {
  const definition = await storage.getVariableDefinition(name);
  if (!definition) {
    throw new Error('Variable definition not found');
  }
  return definition;
};

// Helper function to broadcast WebSocket updates
const broadcastUpdate = (event: string, data: any) => {
  const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  
  wsConnections.forEach((ws, userId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  const PgSession = connectPgSimple(session);
  app.use(session({
    store: new PgSession({
      pool,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  }));

  // Apply rate limiting to API routes
  app.use('/api', apiLimiter);
  app.use('/api/v1/variables', variableLimiter);

  // Demo data endpoint for development
  app.post('/api/demo/create', extractUserId, async (req: any, res) => {
    try {
      const { createDemoData } = await import('./demo-data');
      await createDemoData(req.userId);
      res.json({ success: true, message: 'Demo data created successfully' });
    } catch (error) {
      console.error('Demo data creation error:', error);
      res.status(500).json({ error: 'Failed to create demo data' });
    }
  });

  // Authentication endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await storage.getUserByCredentials(username, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Store user session
      (req as any).session.userId = user.id;
      (req as any).session.user = user;

      res.json({
        success: true,
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Check if user already exists
      const existingUser = await storage.getUser(username);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      const user = await storage.createUser(username, password);

      // Store user session
      const session = (req as any).session;
      if (!session) {
        console.error('Session not available during signup');
        return res.status(500).json({ error: 'Session initialization failed' });
      }
      session.userId = user.id;
      session.user = user;

      res.json({
        success: true,
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Signup failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const session = (req as any).session;
    if (session?.userId) {
      res.json({
        success: true,
        data: {
          id: session.userId,
          ...session.user
        }
      });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Data types endpoint
  app.get('/api/v1/types', (req, res) => {
    res.json({
      success: true,
      data: {
        supportedTypes: SUPPORTED_DATA_TYPES,
        permissionTypes: PERMISSION_TYPES,
      }
    });
  });

  // Variable definition endpoints
  app.get('/api/v1/definitions', extractUserId, async (req: any, res) => {
    try {
      // Get all definitions and filter based on permissions
      const allDefinitions = await storage.getVariableDefinitions();
      
      // Filter based on list permissions following Resonite pattern:
      // - Show global variables with "anyone" list permission (regardless of owner)
      // - Show user's own private variables with "definition_owner" permission
      const visibleDefinitions = allDefinitions.filter(def => {
        // Global variables with "anyone" list permission (visible to all)
        if (def.listPermission === "anyone") {
          return true;
        }
        // User's own private variables
        if (def.ownerId === req.userId && def.listPermission === "definition_owner") {
          return true;
        }
        return false;
      });
      
      res.json({
        success: true,
        data: visibleDefinitions
      });
    } catch (error) {
      console.error('Get definitions error:', error);
      res.status(500).json({ error: 'Failed to fetch variable definitions' });
    }
  });

  app.put('/api/v1/definitions/:name', extractUserId, async (req: any, res) => {
    try {
      const { name } = req.params;
      const validatedData = insertVariableDefinitionSchema.parse({
        ...req.body,
        name,
        ownerId: req.userId
      });

      // Check if definition already exists
      const existing = await storage.getVariableDefinition(name);
      if (existing) {
        return res.status(409).json({ error: 'Variable definition already exists' });
      }

      const definition = await storage.createVariableDefinition(validatedData);
      
      broadcastUpdate('definition_created', definition);
      
      res.status(201).json({
        success: true,
        data: definition
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Create definition error:', error);
      res.status(500).json({ error: 'Failed to create variable definition' });
    }
  });

  app.patch('/api/v1/definitions/:name', extractUserId, async (req: any, res) => {
    try {
      const { name } = req.params;
      const definition = await storage.getVariableDefinition(name);
      
      if (!definition) {
        return res.status(404).json({ error: 'Variable definition not found' });
      }

      if (definition.ownerId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to modify this definition' });
      }

      const updates = req.body;
      const updated = await storage.updateVariableDefinition(definition.id, updates);
      
      broadcastUpdate('definition_updated', updated);
      
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('Update definition error:', error);
      res.status(500).json({ error: 'Failed to update variable definition' });
    }
  });

  app.delete('/api/v1/definitions/:name', extractUserId, async (req: any, res) => {
    try {
      const { name } = req.params;
      const definition = await storage.getVariableDefinition(name);
      
      if (!definition) {
        return res.status(404).json({ error: 'Variable definition not found' });
      }

      if (definition.ownerId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to delete this definition' });
      }

      await storage.deleteVariableDefinition(definition.id);
      
      broadcastUpdate('definition_deleted', { name });
      
      res.json({
        success: true,
        message: 'Variable definition deleted'
      });
    } catch (error) {
      console.error('Delete definition error:', error);
      res.status(500).json({ error: 'Failed to delete variable definition' });
    }
  });

  // Toggle read-only status endpoint
  app.patch('/api/v1/definitions/:id/readonly', extractUserId, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isReadOnly } = req.body;
      
      if (typeof isReadOnly !== 'boolean') {
        return res.status(400).json({ error: 'isReadOnly must be a boolean' });
      }

      const updated = await storage.toggleVariableReadOnly(parseInt(id), isReadOnly, req.userId);
      
      broadcastUpdate('definition_updated', updated);
      
      res.json({
        success: true,
        data: updated
      });
    } catch (error: any) {
      console.error('Toggle read-only error:', error);
      if (error?.message === 'Variable definition not found') {
        return res.status(404).json({ error: 'Variable definition not found' });
      }
      if (error?.message === 'Not authorized to modify read-only status') {
        return res.status(403).json({ error: 'Not authorized to modify read-only status' });
      }
      res.status(500).json({ error: 'Failed to toggle read-only status' });
    }
  });

  // Variable value endpoints
  app.get('/api/v1/variables/:name', extractUserId, async (req: any, res) => {
    try {
      const { name } = req.params;
      const definition = await getVariableDefinition(name);
      
      // For read-only variables, always return the creator's value regardless of requester
      const ownerId = definition.isReadOnly ? definition.ownerId : (req.query.owner || req.userId);
      
      const value = await storage.getVariableValue(definition.id, ownerId);
      
      // Check if request wants JSON response (for dashboard/API explorer)
      // Default to text/plain for Resonite unless explicitly requesting JSON
      const wantsJson = req.query.format === 'json' ||
                       (req.headers.accept && req.headers.accept.includes('application/json')) ||
                       req.headers['x-requested-with'] === 'XMLHttpRequest';
      
      if (!value) {
        // Return default value if no specific value exists
        let returnValue = definition.defaultValue || '';
        
        // Convert enum name to numerical index for text/plain responses
        if (!wantsJson && definition.type === 'enum' && definition.enumType && returnValue) {
          const enumIndex = convertEnumNameToIndex(definition.enumType, returnValue);
          returnValue = enumIndex.toString();
        }
        
        if (wantsJson) {
          const responseData = {
            success: true,
            data: {
              name: definition.name,
              type: definition.type,
              value: definition.defaultValue,
              owner: ownerId,
              permissions: {
                read: definition.readPermission,
                write: definition.writePermission,
                list: definition.listPermission
              },
              isDefault: true
            }
          };
          return res.json(responseData);
        } else {
          // Return raw value for Resonite webhooks (enum as numerical index)
          return res.set('Content-Type', 'text/plain').send(returnValue);
        }
      }

      // Handle enum conversion for text/plain responses
      let returnValue = value.value;
      if (!wantsJson && definition.type === 'enum' && definition.enumType && returnValue) {
        const enumIndex = convertEnumNameToIndex(definition.enumType, returnValue);
        returnValue = enumIndex.toString();
      }

      if (wantsJson) {
        res.json({
          success: true,
          data: {
            name: definition.name,
            type: definition.type,
            value: value.value,
            owner: value.ownerId,
            permissions: {
              read: definition.readPermission,
              write: definition.writePermission,
              list: definition.listPermission
            },
            createdAt: value.createdAt,
            updatedAt: value.updatedAt,
            isDefault: false
          }
        });
      } else {
        // Return raw value for Resonite webhooks (enum as numerical index)
        res.set('Content-Type', 'text/plain').send(returnValue);
      }
    } catch (error) {
      console.error('Get variable error:', error);
      if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
        res.status(500).json({ error: 'Failed to get variable value' });
      } else {
        res.status(500).set('Content-Type', 'text/plain').send('Error');
      }
    }
  });

  app.post('/api/v1/variables/:name', extractUserId, async (req: any, res) => {
    try {
      const { name } = req.params;
      const definition = await getVariableDefinition(name);
      
      // Check if variable is read-only
      if (definition.isReadOnly) {
        const wantsJson = req.headers.accept?.includes('application/json') || req.query.format === 'json';
        if (wantsJson) {
          return res.status(403).json({ error: 'Variable is read-only and can only be modified by the owner via web dashboard' });
        } else {
          return res.status(403).set('Content-Type', 'text/plain').send('Error: Variable is read-only');
        }
      }
      
      // Handle both JSON and plain text input
      let value;
      const contentType = req.headers['content-type'] || '';
      
      if (contentType.includes('application/json') && typeof req.body === 'object' && req.body !== null) {
        // JSON input: extract value from body object
        value = req.body.value;
      } else {
        // Plain text input: use entire body as value
        value = req.body;
        
        // Convert numerical enum index to enum name for text/plain input
        if (definition.type === 'enum' && definition.enumType && isNumericString(String(value))) {
          const enumIndex = parseInt(String(value), 10);
          const enumName = convertEnumIndexToName(definition.enumType, enumIndex);
          value = enumName;
        }
      }
      
      // For read-only variables, the value is locked to the creator's value
      // For regular variables, allow owner specification via JSON or default to current user
      const ownerId = definition.isReadOnly ? definition.ownerId : 
        ((contentType.includes('application/json') && typeof req.body === 'object' ? req.body.owner : undefined) || req.userId);

      if (value === undefined || value === null || value === '') {
        const wantsJson = req.headers.accept?.includes('application/json') || req.query.format === 'json';
        if (wantsJson) {
          return res.status(400).json({ error: 'Value is required' });
        } else {
          return res.status(400).set('Content-Type', 'text/plain').send('Error: Value is required');
        }
      }

      const variableValue = await storage.setVariableValue({
        definitionId: definition.id,
        ownerId,
        value: String(value)
      });

      broadcastUpdate('variable_updated', {
        name: definition.name,
        value: variableValue.value,
        owner: variableValue.ownerId
      });

      // Check if request wants JSON response (for dashboard/API explorer)
      // Default to text/plain for Resonite unless explicitly requesting JSON
      const wantsJson = req.query.format === 'json' ||
                       (req.headers.accept && req.headers.accept.includes('application/json')) ||
                       req.headers['x-requested-with'] === 'XMLHttpRequest';
      
      if (wantsJson) {
        res.json({
          success: true,
          data: {
            name: definition.name,
            type: definition.type,
            value: variableValue.value,
            owner: variableValue.ownerId,
            updatedAt: variableValue.updatedAt
          }
        });
      } else {
        // Return success message for Resonite webhooks
        res.set('Content-Type', 'text/plain').send('OK');
      }
    } catch (error) {
      console.error('Set variable error:', error);
      const wantsJson = req.headers.accept?.includes('application/json') || req.query.format === 'json';
      if (wantsJson) {
        res.status(500).json({ error: 'Failed to set variable value' });
      } else {
        res.status(500).set('Content-Type', 'text/plain').send('Error');
      }
    }
  });

  app.get('/api/v1/variables/:name/values', extractUserId, async (req: any, res) => {
    try {
      const { name } = req.params;
      const definition = await getVariableDefinition(name);
      const values = await storage.getVariableValues(definition.id);

      res.json({
        success: true,
        data: {
          name: definition.name,
          type: definition.type,
          values: values.map(v => ({
            owner: v.ownerId,
            value: v.value,
            updatedAt: v.updatedAt
          }))
        }
      });
    } catch (error) {
      console.error('List variable values error:', error);
      res.status(500).json({ error: 'Failed to list variable values' });
    }
  });

  // Statistics endpoint
  app.get('/api/v1/stats', extractUserId, async (req: any, res) => {
    try {
      const stats = await storage.getStats(req.userId);
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Search endpoint
  app.get('/api/v1/search', extractUserId, async (req: any, res) => {
    try {
      const { q: query } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
      }

      const results = await storage.searchVariableDefinitions(String(query), req.userId);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Toggle variable read-only status
  app.patch('/api/v1/definitions/:id/readonly', extractUserId, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isReadOnly } = req.body;
      
      if (typeof isReadOnly !== 'boolean') {
        return res.status(400).json({ error: 'isReadOnly must be a boolean value' });
      }
      
      const updated = await storage.toggleVariableReadOnly(parseInt(id), isReadOnly, req.userId);
      
      broadcastUpdate('variable_definition_updated', {
        id: updated.id,
        name: updated.name,
        isReadOnly: updated.isReadOnly
      });
      
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Toggle read-only error:', error);
      if (error instanceof Error && error.message === 'Variable not found or access denied') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update variable read-only status' });
      }
    }
  });

  // Update read-only variable value via web dashboard (for creators only)
  app.patch('/api/v1/definitions/:id/value', extractUserId, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { value } = req.body;
      
      if (value === undefined || value === null) {
        return res.status(400).json({ error: 'Value is required' });
      }
      
      // Get the variable definition to check ownership and read-only status
      const definitions = await storage.getVariableDefinitions();
      const definition = definitions.find(def => def.id === parseInt(id));
      
      if (!definition) {
        return res.status(404).json({ error: 'Variable definition not found' });
      }
      
      // Only allow the creator to modify read-only variables via web dashboard
      if (definition.ownerId !== req.userId) {
        return res.status(403).json({ error: 'Only the variable creator can modify this read-only variable' });
      }
      
      if (!definition.isReadOnly) {
        return res.status(400).json({ error: 'This endpoint is only for read-only variables. Use the regular API for editable variables.' });
      }
      
      // Set the value for the creator (owner)
      const variableValue = await storage.setVariableValue({
        definitionId: definition.id,
        ownerId: definition.ownerId,
        value: String(value)
      });
      
      broadcastUpdate('variable_updated', {
        name: definition.name,
        value: variableValue.value,
        owner: variableValue.ownerId
      });
      
      res.json({ success: true, data: variableValue });
    } catch (error) {
      console.error('Update read-only variable value error:', error);
      res.status(500).json({ error: 'Failed to update read-only variable value' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    // Simple authentication via query parameter (in production, use proper auth)
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    
    if (userId) {
      wsConnections.set(userId, ws);
    }

    ws.on('close', () => {
      if (userId) {
        wsConnections.delete(userId);
      }
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      event: 'connected',
      data: { message: 'WebSocket connection established' },
      timestamp: new Date().toISOString()
    }));
  });

  return httpServer;
}
