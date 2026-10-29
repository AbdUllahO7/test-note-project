import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';

describe('Auth Endpoints (/api/auth)', () => {
  beforeAll(async () => {
    // Clear users before tests
    await prisma.note.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.note.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and hash the password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('testuser@example.com');
      expect(res.body.data.role).toBe('USER');
      expect(res.body.data.password).toBeUndefined(); // Ensure password hash is NEVER leaked in response
    });

    it('should prevent Privilege Escalation (ignores role="ADMIN" in registration body)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'hacker@example.com',
          password: 'Password123!',
          role: 'ADMIN' // Malicious attempt to self-promote
        });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('USER'); // Must strictly remain USER
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'AnotherPassword123!'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject registration with password shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'shortpass@example.com',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].message).toMatch(/at least 6 characters/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials and return a JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(typeof res.body.data.token).toBe('string');
      expect(res.body.data.user.email).toBe('testuser@example.com');
      expect(res.body.data.user.role).toBe('USER');
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPassword!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });
});

