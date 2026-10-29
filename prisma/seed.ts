import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role } from '../src/types/role';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.note.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const passwordAdmin = await bcrypt.hash('Admin12345!', 10);
  const passwordUser1 = await bcrypt.hash('User12345!', 10);
  const passwordUser2 = await bcrypt.hash('User12345!', 10);

  // 1. Create Admin user
  const admin = await prisma.user.create({
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
  console.log(`✅ Created Admin user: ${admin.email}`);

  // 2. Create Regular User 1
  const user1 = await prisma.user.create({
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
  console.log(`✅ Created User 1: ${user1.email}`);

  // 3. Create Regular User 2
  const user2 = await prisma.user.create({
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
  console.log(`✅ Created User 2: ${user2.email}`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
