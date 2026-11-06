import app from './app.js';
import { config } from './config.js';
import { closePool } from './db.js';

const databaseHost = (() => {
  try {
    return new URL(config.databaseUrl).host;
  } catch {
    return 'configured';
  }
})();

const server = app.listen(config.port, () => {
  console.log(`Application listening on http://localhost:${config.port}`);
  console.log(`API base URL: http://localhost:${config.port}/api`);
  console.log(`Database: Supabase PostgreSQL (${databaseHost})`);

  if (app.locals.frontendBuildAvailable) {
    console.log(`Frontend: http://localhost:${config.port}`);
  } else {
    console.warn('Frontend build not found. Run `npm run build` from the project root.');
  }
});

function shutdown(signal) {
  console.log(`\n${signal} received. Closing server...`);
  server.close(() => {
    closePool().finally(() => process.exit(0));
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
