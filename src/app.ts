import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // 1. Security Middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false // Allows dashboard CDN styles and scripts
    })
  );
  app.use(cors());

  // 2. Body Parsers with limits
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // 3. Serve Frontend Static UI
  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir));

  // 4. Application API Routes
  app.use('/api', routes);

  // 5. Root route: serve interactive dashboard UI
  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  // 6. Fallback 404 handler for undefined API routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });

  // 7. Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp();
