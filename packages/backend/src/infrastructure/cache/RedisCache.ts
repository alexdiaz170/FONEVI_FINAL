import Redis from 'ioredis';
import type { ICache } from './ICache.js';

export class RedisCache implements ICache {
  private client: Redis;
  private prefix: string;

  constructor(redisUrl: string, prefix: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    this.prefix = prefix;
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(this.prefix + key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    const raw = JSON.stringify(data);
    await this.client.set(this.prefix + key, raw, 'PX', ttlMs);
  }

  async clear(): Promise<void> {
    const stream = this.client.scanStream({ match: this.prefix + '*' });
    const pipeline = this.client.pipeline();
    stream.on('data', (keys: string[]) => {
      for (const key of keys) pipeline.del(key);
    });
    await new Promise<void>((resolve, reject) => {
      stream.on('end', () => resolve());
      stream.on('error', reject);
    });
    await pipeline.exec();
  }
}
