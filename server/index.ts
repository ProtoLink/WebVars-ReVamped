import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.set('trust proxy', 1); // Trust first proxy for rate limiting

// Enhanced middleware to handle both JSON and text/plain content parsing
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  const isVariableEndpoint = req.path.startsWith('/api/v1/variables');
  
  if (isVariableEndpoint && contentType.includes('text/plain')) {
    // Parse as text/plain for variable endpoints
    express.text({ type: 'text/plain' })(req, res, next);
  } else if (contentType.includes('application/json') || !contentType || contentType.includes('application/x-www-form-urlencoded')) {
    // Parse as JSON or URL-encoded for standard requests
    express.json()(req, res, (err) => {
      if (err) {
        // If JSON parsing fails and it's a variable endpoint, try parsing as text
        if (isVariableEndpoint) {
          express.text({ type: '*/*' })(req, res, next);
        } else {
          next(err);
        }
      } else {
        express.urlencoded({ extended: false })(req, res, next);
      }
    });
  } else {
    // Default to text parsing for other content types on variable endpoints
    if (isVariableEndpoint) {
      express.text({ type: '*/*' })(req, res, next);
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
