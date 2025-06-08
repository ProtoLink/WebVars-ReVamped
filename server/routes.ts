import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertVariableDefinitionSchema, insertVariableValueSchema, insertWebhookSchema, SUPPORTED_DATA_TYPES, PERMISSION_TYPES } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

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

// Middleware to authenticate requests (supports both session and API key)
const authenticateRequest = async (req: any, res: any, next: any) => {
  // Try session authentication first
  if (req.session && req.session.user) {
    try {
      let user = await storage.getUser(req.session.user.id);
      if (!user) {
        user = await storage.upsertUser({
          id: req.session.user.id,
          email: req.session.user.email,
          firstName: req.session.user.firstName,
          lastName: req.session.user.lastName,
          profileImageUrl: req.session.user.profileImageUrl,
        });
      }
      req.user = user;
      req.userId = user.id;
      req.authType = 'session';
      return next();
    } catch (error) {
      console.error('Session authentication error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }

  // Fall back to API key authentication
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const apiKey = authHeader.substring(7);
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  try {
    const apiKeyRecord = await storage.getApiKeyByHash(keyHash);
    
    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used timestamp
    await storage.updateApiKeyLastUsed(apiKeyRecord.id);
    
    req.apiKey = apiKeyRecord;
    req.userId = apiKeyRecord.userId;
    req.authType = 'apikey';
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware for API key only authentication (for external API access)
const authenticateApiKey = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const apiKey = authHeader.substring(7);
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  try {
    const apiKeyRecord = await storage.getApiKeyByHash(keyHash);
    
    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used timestamp
    await storage.updateApiKeyLastUsed(apiKeyRecord.id);
    
    req.apiKey = apiKeyRecord;
    req.userId = apiKeyRecord.userId;
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware to check variable permissions
const checkVariablePermission = (action: 'read' | 'write' | 'list') => {
  return async (req: any, res: any, next: any) => {
    try {
      const { name } = req.params;
      const userId = req.userId;
      
      const definition = await storage.getVariableDefinition(name);
      if (!definition) {
        return res.status(404).json({ error: 'Variable definition not found' });
      }

      let permission: string;
      switch (action) {
        case 'read':
          permission = definition.readPermission;
          break;
        case 'write':
          permission = definition.writePermission;
          break;
        case 'list':
          permission = definition.listPermission;
          break;
      }

      // Check permission logic (simplified)
      const hasPermission = 
        permission === 'anyone' ||
        (permission === 'definition_owner' && definition.ownerId === userId) ||
        (permission === 'variable_owner' && userId) || // Would need more context for variable_owner
        (permission.includes('unsafe') && true); // Unsafe permissions allow broader access

      if (!hasPermission) {
        return res.status(403).json({ error: `Insufficient permissions for ${action} operation` });
      }

      req.definition = definition;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
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
  // Auth middleware
  await setupAuth(app);

  // Apply rate limiting to API routes
  app.use('/api', apiLimiter);
  app.use('/api/v1/variables', variableLimiter);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
  app.get('/api/v1/definitions', authenticateRequest, async (req: any, res) => {
    try {
      const definitions = await storage.getVariableDefinitions(req.userId);
      res.json({
        success: true,
        data: definitions
      });
    } catch (error) {
      console.error('Get definitions error:', error);
      res.status(500).json({ error: 'Failed to fetch variable definitions' });
    }
  });

  app.put('/api/v1/definitions/:name', authenticateApiKey, async (req: any, res) => {
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

  app.patch('/api/v1/definitions/:name', authenticateApiKey, async (req: any, res) => {
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

  app.delete('/api/v1/definitions/:name', authenticateApiKey, async (req: any, res) => {
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

  // Variable value endpoints
  app.get('/api/v1/variables/:name', authenticateApiKey, checkVariablePermission('read'), async (req: any, res) => {
    try {
      const definition = req.definition;
      const ownerId = req.query.owner || req.userId;
      
      const value = await storage.getVariableValue(definition.id, ownerId);
      
      if (!value) {
        // Return default value if no specific value exists
        return res.json({
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
        });
      }

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
    } catch (error) {
      console.error('Get variable error:', error);
      res.status(500).json({ error: 'Failed to get variable value' });
    }
  });

  app.post('/api/v1/variables/:name', authenticateApiKey, checkVariablePermission('write'), async (req: any, res) => {
    try {
      const definition = req.definition;
      const { value } = req.body;
      const ownerId = req.body.owner || req.userId;

      if (value === undefined || value === null) {
        return res.status(400).json({ error: 'Value is required' });
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
    } catch (error) {
      console.error('Set variable error:', error);
      res.status(500).json({ error: 'Failed to set variable value' });
    }
  });

  app.get('/api/v1/variables/:name/values', authenticateApiKey, checkVariablePermission('list'), async (req: any, res) => {
    try {
      const definition = req.definition;
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

  // API key management endpoints
  app.get('/api/v1/api-keys', authenticateRequest, async (req: any, res) => {
    try {
      const apiKeys = await storage.getUserApiKeys(req.userId);
      res.json({
        success: true,
        data: apiKeys.map(key => ({
          id: key.id,
          name: key.name,
          isActive: key.isActive,
          lastUsed: key.lastUsed,
          createdAt: key.createdAt
        }))
      });
    } catch (error) {
      console.error('Get API keys error:', error);
      res.status(500).json({ error: 'Failed to fetch API keys' });
    }
  });

  app.post('/api/v1/api-keys', authenticateApiKey, async (req: any, res) => {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'API key name is required' });
      }

      const { key, apiKey } = await storage.createApiKey({
        userId: req.userId,
        name,
        isActive: true
      });

      res.status(201).json({
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key, // Only return the key once
          createdAt: apiKey.createdAt
        }
      });
    } catch (error) {
      console.error('Create API key error:', error);
      res.status(500).json({ error: 'Failed to create API key' });
    }
  });

  app.delete('/api/v1/api-keys/:id', authenticateApiKey, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteApiKey(parseInt(id));
      
      res.json({
        success: true,
        message: 'API key deleted'
      });
    } catch (error) {
      console.error('Delete API key error:', error);
      res.status(500).json({ error: 'Failed to delete API key' });
    }
  });

  // Webhook endpoints
  app.get('/api/v1/webhooks', authenticateApiKey, async (req: any, res) => {
    try {
      const webhooks = await storage.getWebhooks(req.userId);
      res.json({
        success: true,
        data: webhooks
      });
    } catch (error) {
      console.error('Get webhooks error:', error);
      res.status(500).json({ error: 'Failed to fetch webhooks' });
    }
  });

  app.post('/api/v1/webhooks', authenticateApiKey, async (req: any, res) => {
    try {
      const validatedData = insertWebhookSchema.parse({
        ...req.body,
        userId: req.userId
      });

      const webhook = await storage.createWebhook(validatedData);
      
      res.status(201).json({
        success: true,
        data: webhook
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Create webhook error:', error);
      res.status(500).json({ error: 'Failed to create webhook' });
    }
  });

  // Statistics endpoint
  app.get('/api/v1/stats', authenticateRequest, async (req: any, res) => {
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
  app.get('/api/v1/search', authenticateApiKey, async (req: any, res) => {
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
