import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';

describe('Rate Limiter Middleware', () => {
  it('should enforce rate limiting and return 429 when threshold is exceeded', async () => {
    const testApp = express();
    testApp.use(express.json());

    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: 3, // Allow max 3 attempts
      statusCode: 429,
      message: {
        success: false,
        message: 'Too many attempts. Please try again later.'
      }
    });

    testApp.post('/api/test-limit', limiter, (_req, res) => {
      res.status(200).json({ success: true, message: 'Passed' });
    });

    // Request 1: OK
    const r1 = await request(testApp).post('/api/test-limit');
    expect(r1.status).toBe(200);

    // Request 2: OK
    const r2 = await request(testApp).post('/api/test-limit');
    expect(r2.status).toBe(200);

    // Request 3: OK
    const r3 = await request(testApp).post('/api/test-limit');
    expect(r3.status).toBe(200);

    // Request 4: Rate limited!
    const r4 = await request(testApp).post('/api/test-limit');
    expect(r4.status).toBe(429);
    expect(r4.body.success).toBe(false);
    expect(r4.body.message).toMatch(/Too many attempts/i);
  });
});
