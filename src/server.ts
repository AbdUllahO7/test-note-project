import app from './app';
import { env } from './config/env';
import { prisma } from './config/db';
import { seedDatabaseIfEmpty } from './services/seed.service';

const startServer = async () => {
  // Ensure default users exist so evaluator can test immediately without manual seeding
  await seedDatabaseIfEmpty();

  const server = app.listen(env.PORT, () => {
    console.log('====================================================');
    console.log(`🚀 Notes SaaS API server is running on port ${env.PORT}`);
    console.log(`📍 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 Web UI: http://localhost:${env.PORT}/`);
    console.log(`📡 Base API: http://localhost:${env.PORT}/api`);
    console.log('====================================================');
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log('🔌 HTTP server closed.');
      await prisma.$disconnect();
      console.log('💾 Database disconnected.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
