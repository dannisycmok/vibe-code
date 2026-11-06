import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const currentFile = fileURLToPath(import.meta.url);
const backendRoot = path.resolve(path.dirname(currentFile), '..');

dotenv.config({ path: path.join(backendRoot, '.env'), quiet: true });

function resolveBackendPath(value, fallback) {
  if (!value) {
    return fallback;
  }

  return path.isAbsolute(value) ? value : path.resolve(backendRoot, value);
}

export const config = {
  port: Number(process.env.PORT) || 5001,
  databaseUrl: process.env.DATABASE_URL?.trim(),
  frontendDist: resolveBackendPath(
    process.env.FRONTEND_DIST,
    path.resolve(backendRoot, '..', 'frontend', 'dist'),
  ),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
