import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import bcrypt from 'bcryptjs';
import { Role } from '../src/types/role';

describe('External Integration Endpoints (/api/external)', () => {
  let authToken: string;

  beforeAll(async () => {
    await prisma.note.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    await prisma.user.create({
      data: {
        email: 'apiuser@test.com',
        password: hashedPassword,
        role: Role.USER
      }
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'apiuser@test.com',
      password: 'Password123!'
    });
    authToken = res.body.data.token;
  });

  afterAll(async () => {
    await prisma.note.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should reject unauthenticated access to /api/external/rates with 401', async () => {
    const res = await request(app).get('/api/external/rates');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return external rates for authenticated user', async () => {
    const res = await request(app)
      .get('/api/external/rates?base=USD')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.base_code).toBe('USD');
    expect(res.body.data.conversion_rates).toBeDefined();
    expect(res.body.data.conversion_rates.EUR).toBeDefined();
  });
});

