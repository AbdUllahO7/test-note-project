import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import bcrypt from 'bcryptjs';
import { Role } from '../src/types/role';

describe('Notes Endpoints (/api/notes)', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let adminToken: string;
  let user1NoteId: string;

  beforeAll(async () => {
    // Clean database
    await prisma.note.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Create User 1
    const user1 = await prisma.user.create({
      data: {
        email: 'alice@test.com',
        password: hashedPassword,
        role: Role.USER
      }
    });
    user1Id = user1.id;

    // Create User 2
    const user2 = await prisma.user.create({
      data: {
        email: 'bob@test.com',
        password: hashedPassword,
        role: Role.USER
      }
    });
    user2Id = user2.id;

    // Create Admin
    await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        role: Role.ADMIN
      }
    });

    // Obtain tokens
    const res1 = await request(app).post('/api/auth/login').send({
      email: 'alice@test.com',
      password: 'Password123!'
    });
    user1Token = res1.body.data.token;

    const res2 = await request(app).post('/api/auth/login').send({
      email: 'bob@test.com',
      password: 'Password123!'
    });
    user2Token = res2.body.data.token;

    const resAdmin = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'Password123!'
    });
    adminToken = resAdmin.body.data.token;
  });

  afterAll(async () => {
    await prisma.note.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Authentication Check', () => {
    it('should reject unauthenticated request to /api/notes with 401', async () => {
      const res = await request(app).get('/api/notes');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/notes (Create Note)', () => {
    it('should allow user1 to create a note', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: "Alice's Secret Plan",
          content: 'Confidential strategic roadmap for Q4.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Alice's Secret Plan");
      expect(res.body.data.userId).toBe(user1Id);
      user1NoteId = res.body.data.id;
    });

    it('should reject creating a note without title or content', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/notes (List Notes)', () => {
    it('should return only Alice notes for Alice', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toHaveLength(1);
      expect(res.body.data.notes[0].id).toBe(user1NoteId);
    });

    it('should return empty notes list for Bob (data isolation)', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toHaveLength(0);
    });

    it('should allow Admin to see all notes from all users', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.scope).toContain('ALL_NOTES');
      expect(res.body.data.notes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('IDOR & Ownership Protection (/api/notes/:id)', () => {
    it('should prevent Bob from viewing Alice note (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Note not found');
    });

    it('should allow Alice to view her own note', async () => {
      const res = await request(app)
        .get(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(user1NoteId);
    });

    it('should allow Admin to view Alice note', async () => {
      const res = await request(app)
        .get(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(user1NoteId);
    });

    it('should prevent Bob from updating Alice note (returns 404)', async () => {
      const res = await request(app)
        .put(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Hacked by Bob'
        });

      expect(res.status).toBe(404);
    });

    it('should allow Alice to update her own note', async () => {
      const res = await request(app)
        .put(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: "Alice's Updated Note"
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Alice's Updated Note");
    });

    it('should prevent Bob from deleting Alice note (returns 404)', async () => {
      const res = await request(app)
        .delete(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
    });

    it('should allow Admin to delete Alice note', async () => {
      const res = await request(app)
        .delete(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Note deleted successfully');
    });
  });
});

