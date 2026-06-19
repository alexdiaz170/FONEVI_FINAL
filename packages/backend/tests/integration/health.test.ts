import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { startServer } from '../../src/index.js';

let app: Awaited<ReturnType<typeof startServer>>['app'];
let server: Awaited<ReturnType<typeof startServer>>['server'];

beforeAll(async () => {
  const instance = await startServer(0); // puerto 0 = puerto aleatorio
  app = instance.app;
  server = instance.server;
});

afterAll(() => {
  server.close();
});

describe('GET /health', () => {
  it('should return 200 with ok status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.datos).toBeDefined();
    expect(res.body.datos.status).toBe('ok');
    expect(res.body.datos.version).toBe('0.1.0');
    expect(res.body.datos.uptime).toBeGreaterThan(0);
    expect(res.body.datos.timestamp).toBeDefined();
    expect(res.body.datos.environment).toBeDefined();
  });

  it('should not be rate limited', async () => {
    // Hacer varias peticiones rápidas
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request(app).get('/health')),
    );
    responses.forEach((res) => expect(res.status).toBe(200));
  });

  it('should return valid JSON', async () => {
    const res = await request(app).get('/health');
    expect(() => JSON.parse(JSON.stringify(res.body))).not.toThrow();
  });
});
