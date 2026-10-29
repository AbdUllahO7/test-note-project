import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // 1. Security Middlewares
  app.use(helmet());
  app.use(cors());

  // 2. Body Parsers with limits
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // 3. Application API Routes
  app.use('/api', routes);

  // 4. Fallback 404 handler for undefined routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });

  // 5. Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp();

