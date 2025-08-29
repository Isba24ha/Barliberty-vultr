import { config } from 'dotenv';
// Load env vars from .env file FIRST
config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import WebSocket from 'ws';
import * as schema from '@shared/schema';

// Configure WebSocket for serverless environment (Node.js)
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = WebSocket;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to create a .env file?",
  );
}

// Global shutdown flag to prevent usage after shutdown
let isShuttingDown = false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 15,
  min: 3,
  connectionTimeoutMillis: 15000, // increased timeout to 15s for better reliability
  idleTimeoutMillis: 120000,      // 2 minutes
  allowExitOnIdle: false,
  application_name: 'liberty-bar-management',
});

// Safe pool getter
export function getPool() {
  if (isShuttingDown) {
    throw new Error('Cannot access database: Application is shutting down');
  }
  return pool;
}

// Shutdown function
export async function shutdownPool() {
  if (isShuttingDown) {
    console.log('Pool shutdown already initiated');
    return;
  }
  isShuttingDown = true;
  console.log('Initiating database pool shutdown...');

  try {
    await pool.end();
    console.log('Database pool closed successfully');
  } catch (error) {
    console.error('Error during pool shutdown:', error);
    throw error;
  }
}

// Initialize drizzle ORM client
export const db = drizzle({ client: getPool(), schema });

// Pool event monitoring
pool.on('connect', () => {
  console.log('Database connection established');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

pool.on('remove', () => {
  console.log('Database connection removed from pool');
});
