import { PrismaClient } from '@prisma/client';
import { logger } from '../logging/logger.js';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      transactionOptions: {
        maxWait: 10000,
        timeout: 20000,
      },
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    prisma.$on('query' as never, (e: unknown) => {
      logger.debug('Prisma query', { query: (e as { query: string }).query });
    });

    prisma.$on('error' as never, (e: unknown) => {
      logger.error('Prisma error', { error: String(e) });
    });
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
