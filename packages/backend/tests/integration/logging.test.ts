import { describe, it, expect } from 'vitest';
import { logger } from '../../src/infrastructure/logging/logger.js';

describe('Logger (Winston)', () => {
  it('should have correct service name', () => {
    expect(logger.defaultMeta).toBeDefined();
    expect((logger.defaultMeta as Record<string, unknown>).service).toBe('fonevi-backend');
  });

  it('should log at various levels without throwing', () => {
    expect(() => {
      logger.debug('debug test');
      logger.info('info test');
      logger.warn('warn test');
      logger.error('error test');
    }).not.toThrow();
  });
});
