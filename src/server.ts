import app from './app';
import { env } from './config/env';
import { prisma } from './config/db';

const server = app.listen(env.PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Notes SaaS API server is running on port ${env.PORT}`);
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`📡 Base URL: http://localhost:${env.PORT}/api`);
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
