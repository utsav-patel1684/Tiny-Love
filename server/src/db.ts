import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✨ Run a quick test query to log the live connection status
pool.connect()
  .then(client => {
    console.log('🟢 [Database]: Successfully connected to the live Neon PostgreSQL instance.');
    client.release(); // Immediately release the client back to the pool so it can be reused
  })
  .catch(err => {
    console.error('🔴 [Database]: Connection failed! Check your DATABASE_URL environment variable.');
    console.error(err.message);
  });

export const db = drizzle(pool, { schema });