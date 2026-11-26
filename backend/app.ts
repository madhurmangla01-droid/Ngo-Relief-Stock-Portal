import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { initializeDatabase } from './db/database.ts';
import { apiRouter } from './routes/index.ts';

export function createBackendApp() {
  initializeDatabase();

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRouter);

  // Return JSON 404 for unknown API paths
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Centralized error handler (never leaks raw stack traces or SQL internals)
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled backend error:', err);
    if (res.headersSent) return;
    res.status(500).json({ error: 'An unexpected server error occurred. Please try again.' });
  });

  return app;
}
