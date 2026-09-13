import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { verifyDatabaseConnection } from "./db";

const app = express();
app.set('trust proxy', 1); // Trust first proxy for rate limiting

// Enhanced middleware to handle both JSON and text/plain content parsing
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  const isVariableEndpoint = req.path.startsWith('/api/v1/variables') && req.method !== 'GET';
  
  if (isVariableEndpoint) {
    // For variable endpoints, always try text parsing first, then JSON if needed
    if (contentType.includes('text/plain')) {
      express.text({ type: 'text/plain' })(req, res, next);
    } else if (contentType.includes('application/json')) {
      // Try JSON first, but fallback to text if it fails
      express.raw({ type: 'application/json' })(req, res, (err) => {
        if (err) {
          express.text({ type: '*/*' })(req, res, next);
        } else {
          try {
            req.body = JSON.parse(req.body.toString());
            next();
          } catch (parseErr) {
            // JSON parsing failed, treat as text
            req.body = req.body.toString();
            next();
          }
        }
      });
    } else {
      // Default to text for variable endpoints with unknown content types
      express.text({ type: '*/*' })(req, res, next);
    }
  } else {
    // For non-variable endpoints, use standard parsing
    if (contentType.includes('application/json')) {
      express.json()(req, res, next);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      express.urlencoded({ extended: false })(req, res, next);
    } else {
      next();
    }
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await verifyDatabaseConnection();
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
