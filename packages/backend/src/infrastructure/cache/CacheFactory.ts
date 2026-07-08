import { config } from '../../config/index.js';
import { logger } from '../logging/logger.js';
import type { ICache } from './ICache.js';
import { SimpleCache } from './SimpleCache.js';
import { RedisCache } from './RedisCache.js';

let cacheInstance: ICache | null = null;

export async function getCache(): Promise<ICache> {
  if (cacheInstance) return cacheInstance;

  if (config.redisUrl) {
    const redis = new RedisCache(config.redisUrl, config.redisKeyPrefix);
    try {
      await redis.connect();
      logger.info('Caché: Redis conectado');
      cacheInstance = redis;
    } catch (err) {
      logger.error('Error conectando a Redis, usando caché en memoria', { error: String(err) });
      cacheInstance = new SimpleCache();
    }
  } else {
    logger.info('Caché: usando almacenamiento en memoria (SimpleCache)');
    cacheInstance = new SimpleCache();
  }

  return cacheInstance;
}

export async function disconnectCache(): Promise<void> {
  if (cacheInstance instanceof RedisCache) {
    await cacheInstance.disconnect();
    cacheInstance = null;
  }
}
