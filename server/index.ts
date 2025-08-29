import { config } from 'dotenv';
// Load environment variables from .env file FIRST
config();

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { getPool, shutdownPool } from "./db";
import ConnectPgSimple from "connect-pg-simple";

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// HTTPS redirect middleware for production
if (isProduction) {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// CORS configuration to allow all origins dynamically
const corsOptions = {
  origin: function (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    // Allow all origins dynamically without hardcoding URLs
    callback(null, true);
  },
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Check database connection before starting
async function checkDatabaseConnection() {
  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    log('Database connection verified');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Log environment variables for production debugging
if (isProduction) {
  log(`Environment variables check:`);
  log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);
  log(`REPLIT_DOMAIN: ${process.env.REPLIT_DOMAIN || 'NOT SET'}`);
  log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
  log(`SESSION_SECRET: ${process.env.SESSION_SECRET ? 'SET' : 'NOT SET'}`);
}

// Enhanced middleware configuration
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser()); // Add cookie parser middleware

// Security headers
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });
  next();
});

// Configure session with simplified settings for debugging
const PgSession = ConnectPgSimple(session);

const sessionConfig = {
  store: new PgSession({
    pool: getPool(),
    tableName: 'sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15, // Clean up sessions every 15 minutes
    errorLog: (error: any) => {
      console.error('Session store error:', error);
    }
  }),
  secret: process.env.SESSION_SECRET || "liberty-bar-management-secret-key-2025",
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  name: 'liberty.session', // Use custom session name
  cookie: {
    secure: false, // Set to true if using HTTPS in production!
    httpOnly: false, // For debugging cookie issues (set true in production)
    maxAge: 8 * 60 * 60 * 1000, // 8 hours to match client session
    sameSite: 'lax' as const,
    path: '/'
  }
};

app.use(session(sessionConfig));

// Session debugging middleware (can be removed in production)
if (!isProduction) {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') && req.path !== '/api/auth/user') {
      console.log(`[Session] ${req.method} ${req.path} - User: ${req.session?.user?.id || 'Anonymous'}`);
    }
    next();
  });
}

// Request logging middleware
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

// Enhanced error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ 
      message: 'Database connection failed',
      error: 'Service temporarily unavailable'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation failed',
      error: err.message
    });
  }

  res.status(500).json({ 
    message: 'Internal server error',
    error: isProduction ? 'Something went wrong' : err.message
  });
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  log(`${signal} received, shutting down gracefully`);

  try {
    await shutdownPool();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Server startup
(async () => {
  try {
    // Verify database connection before starting server
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      log('Failed to connect to database, retrying in 5 seconds...');
      setTimeout(() => process.exit(1), 5000);
      return;
    }

    const server = await registerRoutes(app);

    // Setup development or production serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Use 127.0.0.1 (IPv4) instead of localhost to avoid IPv6 issues on Windows
    const port = 5000;
    const host = process.platform === 'win32' ? '127.0.0.1' : '0.0.0.0';

    // Fixed listen call for Windows compatibility
    server.listen(port, host, () => {
      log(`🚀 LIBERTY Bar Management System serving on http://${host}:${port}`);
      log(`📊 Database: Connected and ready`);
      log(`🔐 Session store: PostgreSQL`);
      log(`🌐 Environment: ${app.get("env")}`);
      log(`💻 Platform: ${process.platform}`);
    });

  } catch (error) {
    log(`Failed to start server: ${error}`);
    process.exit(1);
  }
})();
