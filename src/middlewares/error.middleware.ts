import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. AppError (Custom controlled error)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
    return;
  }

  // 2. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation (e.g. duplicate email)
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'Field';
      res.status(409).json({
        success: false,
        message: `${target} already exists`
      });
      return;
    }

    // Record not found
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Requested record was not found'
      });
      return;
    }
  }

  // 3. JSON parse error
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON payload'
    });
    return;
  }

  // 4. Default 500 Server Error
  console.error('💥 Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.NODE_ENV === 'development' ? { stack: err.stack, details: err.message } : {})
  });
};
