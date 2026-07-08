import { URL } from 'url';
import { Queue, Worker, Job } from 'bullmq';
import { config } from '../../config/index.js';
import { logger } from '../logging/logger.js';

export type JobPayload = Record<string, unknown>;
export type JobProcessor<T extends JobPayload = JobPayload> = (payload: T) => Promise<void>;

type ConnectionConfig = {
  host: string;
  port: number;
  password?: string;
  db?: number;
} | null;

let connectionConfig: ConnectionConfig = null;
let queues: Map<string, Queue> = new Map();
let workers: Worker[] = [];
let connectionReady = false;

function parseRedisUrl(url: string): ConnectionConfig {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      db: parsed.pathname ? parseInt(parsed.pathname.slice(1), 10) || undefined : undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

function getConnectionConfig(): ConnectionConfig {
  if (connectionConfig) return connectionConfig;
  if (!config.redisUrl) {
    logger.info('REDIS_URL no configurada — colas desactivadas, ejecución inline');
    connectionConfig = null;
    return null;
  }
  connectionConfig = parseRedisUrl(config.redisUrl);
  return connectionConfig;
}

async function ensureConnection(): Promise<ConnectionConfig> {
  const cc = getConnectionConfig();
  if (!cc) return null;
  if (connectionReady) return cc;
  // Verify connectivity with a lightweight ping
  try {
    const conn = new (await import('ioredis')).default({
      host: cc.host,
      port: cc.port,
      password: cc.password,
      db: cc.db,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    await conn.connect();
    await conn.ping();
    await conn.quit();
    connectionReady = true;
    logger.info(`Redis conectado en ${cc.host}:${cc.port}`);
    return cc;
  } catch (err) {
    logger.warn('Redis no disponible — colas desactivadas', { error: String(err) });
    connectionConfig = null;
    return null;
  }
}

export async function initQueue(name: string): Promise<Queue | null> {
  const cc = await ensureConnection();
  if (!cc) return null;
  if (queues.has(name)) return queues.get(name)!;
  const q = new Queue(name, {
    connection: cc,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600 * 24 },
      removeOnFail: { age: 3600 * 24 * 7 },
    },
  });
  queues.set(name, q);
  logger.info(`Cola "${name}" inicializada en Redis`);
  return q;
}

export async function initWorker<T extends JobPayload>(
  queueName: string,
  processor: JobProcessor<T>,
): Promise<Worker | null> {
  const cc = await ensureConnection();
  if (!cc) return null;
  const worker = new Worker<T>(
    queueName,
    async (job: Job<T>) => {
      logger.info(`Procesando trabajo ${job.id} de "${queueName}"`);
      try {
        await processor(job.data);
      } catch (err) {
        logger.error(`Trabajo ${job.id} de "${queueName}" falló`, { error: String(err) });
        throw err;
      }
    },
    { connection: cc },
  );
  workers.push(worker);
  logger.info(`Worker "${queueName}" registrado`);
  return worker;
}

export async function enqueue<T extends JobPayload>(
  queue: Queue | null,
  payload: T,
  options?: { delay?: number },
): Promise<string | null> {
  if (!queue) return null;
  const job = await queue.add('job', payload, {
    delay: options?.delay,
  });
  return job.id ?? null;
}

export function isQueueAvailable(): boolean {
  return connectionReady;
}

export async function shutdownQueues(): Promise<void> {
  for (const w of workers) {
    await w.close();
  }
  workers = [];
  for (const q of queues.values()) {
    await q.close();
  }
  queues.clear();
  connectionReady = false;
  connectionConfig = null;
  logger.info('Colas cerradas');
}
