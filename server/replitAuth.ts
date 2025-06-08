import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

// Authentication setup - Mock for development, ready for production Replit Auth
export async function setupAuth(app: Express) {
  app.use(getSession());

  if (process.env.NODE_ENV === 'development') {
    // Development mock authentication
    app.get('/api/login', (req: any, res) => {
      req.session.user = {
        id: 'dev-user-001',
        email: 'developer@example.com',
        firstName: 'Dev',
        lastName: 'User',
        profileImageUrl: null,
      };
      res.redirect('/dashboard');
    });

    app.get('/api/logout', (req: any, res) => {
      req.session.destroy(() => {
        res.redirect('/');
      });
    });
  } else {
    // Production: Redirect to setup instructions
    app.get('/api/login', (req, res) => {
      res.status(501).json({ 
        error: 'Authentication not configured',
        message: 'Please configure Replit Auth for production use',
        documentation: '/docs/auth-setup'
      });
    });

    app.get('/api/logout', (req, res) => {
      res.status(501).json({ 
        error: 'Authentication not configured',
        message: 'Please configure Replit Auth for production use'
      });
    });
  }
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Ensure user exists in database
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
    next();
  } catch (error) {
    console.error('User authentication error:', error);
    res.status(500).json({ message: "Authentication failed" });
  }
};