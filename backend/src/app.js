import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { httpError } from './utils/http-error.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import orderRoutes from './routes/orders.js';

const app = express();
const frontendIndex = path.join(config.frontendDist, 'index.html');
const frontendBuildAvailable = fs.existsSync(frontendIndex);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.locals.frontendBuildAvailable = frontendBuildAvailable;
app.locals.frontendIndex = frontendIndex;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (config.corsOrigins.includes(origin)) return true;

  if (process.env.NODE_ENV !== 'production') {
    return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  }

  return false;
}

function isSameOrigin(req, origin) {
  try {
    return new URL(origin).host === req.get('host');
  } catch {
    return false;
  }
}

// Only API routes need CORS. Static assets are same-origin and must not be
// rejected because the browser sends an Origin header for module requests.
app.use('/api', cors((req, callback) => {
  const origin = req.get('Origin');

  if (!origin || isAllowedOrigin(origin) || isSameOrigin(req, origin)) {
    callback(null, { origin: true });
    return;
  }

  callback(httpError(403, 'This origin is not allowed by CORS.'));
}));

app.use(express.json({ limit: '1mb' }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

if (frontendBuildAvailable) {
  app.use(express.static(config.frontendDist, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));
}

app.get('/api', (_req, res) => {
  res.json({
    name: 'CRUD Test API',
    status: 'ok',
    database: 'supabase-postgres',
    health: '/api/health',
    frontend: frontendBuildAvailable ? '/' : null,
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', productRoutes);
app.use('/api', userRoutes);
app.use('/api', orderRoutes);

app.use('/api', (req, _res, next) => {
  next(httpError(404, `API route not found: ${req.method} ${req.originalUrl}`));
});

if (frontendBuildAvailable) {
  // Serve index.html for client-side routes such as /products and /orders.
  app.use((req, res, next) => {
    const isReadRequest = req.method === 'GET' || req.method === 'HEAD';

    if (!isReadRequest || req.path.startsWith('/api') || path.extname(req.path)) {
      next();
      return;
    }

    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(frontendIndex);
  });
} else {
  app.get('/', (_req, res) => {
    res.json({
      name: 'CRUD Test API',
      status: 'ok',
      message: 'Frontend build not found. Run npm run build from the project root.',
      health: '/api/health',
    });
  });
}

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  let status = Number(error.status) || 500;
  let message = error.message || 'Internal server error.';
  let errors = error.errors;

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    status = 400;
    message = 'Invalid JSON request body.';
    errors = undefined;
  }

  if (error.code === '23505') {
    status = 409;
    message = 'A record with the same unique value already exists.';
  }

  if (error.code === '23503') {
    status = 409;
    message = 'This record is still referenced by another record and cannot be changed or deleted.';
  }

  if (error.code === '22P02') {
    status = 400;
    message = 'One of the submitted values has an invalid format.';
  }

  if (status >= 500) {
    console.error(error);
  }

  const payload = { message };

  if (errors) {
    payload.errors = errors;
  }

  res.status(status).json(payload);
});

export default app;
