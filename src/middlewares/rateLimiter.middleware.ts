import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const loginRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // Default: 15 minutes
  max: env.RATE_LIMIT_MAX_ATTEMPTS, // Default: 5 attempts
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  statusCode: 429,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  },
  skip: () => env.NODE_ENV === 'test' // Skip during automated test execution unless testing rate limiter specifically
});
