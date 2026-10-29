import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { Role } from '../types/role';

export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return; // Database already has users
    }

    console.log('🌱 Database is empty. Auto-seeding initial users and notes...');

    const passwordAdmin = await bcrypt.hash('Admin12345!', 10);
    const passwordUser1 = await bcrypt.hash('User12345!', 10);
    const passwordUser2 = await bcrypt.hash('User12345!', 10);

    // 1. Admin user
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: passwordAdmin,
        role: Role.ADMIN,
        notes: {
          create: [
            {
              title: 'Admin Master Plan',
              content: 'Review and audit all platform operations.'
            }
          ]
        }
      }
    });

    // 2. Alice (USER)
    await prisma.user.create({
      data: {
        email: 'alice@example.com',
        password: passwordUser1,
        role: Role.USER,
        notes: {
          create: [
            {
              title: "Alice's Secret Note",
              content: 'This note belongs to Alice and Bob must never access it.'
            },
            {
              title: 'Meeting Notes',
              content: 'Discuss sprint deliverables on Monday morning.'
            }
          ]
        }
      }
    });

    // 3. Bob (USER)
    await prisma.user.create({
      data: {
        email: 'bob@example.com',
        password: passwordUser2,
        role: Role.USER,
        notes: {
          create: [
            {
              title: "Bob's Project Idea",
              content: 'Build a decentralized micro-SaaS.'
            }
          ]
        }
      }
    });

    console.log('✅ Auto-seeding completed: Admin, Alice, and Bob are ready!');
  } catch (error) {
    console.error('⚠️ Auto-seeding check error:', error);
  }
}
