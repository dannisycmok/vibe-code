import pg from 'pg';
import { config } from './config.js';

if (!config.databaseUrl) {
  throw new Error('Missing DATABASE_URL in backend/.env.');
}

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: process.env.DATABASE_SSL === 'false'
    ? false
    : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

export function query(text, params) {
  return pool.query(text, params);
}

export function closePool() {
  return pool.end();
}

export default pool;
