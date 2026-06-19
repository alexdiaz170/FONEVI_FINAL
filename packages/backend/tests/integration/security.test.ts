import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { startServer } from '../../src/index.js';

let app: Awaited<ReturnType<typeof startServer>>['app'];
let server: Awaited<ReturnType<typeof startServer>>['server'];

beforeAll(async () => {
  const instance = await startServer(0);
  app = instance.app;
  server = instance.server;
});

afterAll(() => {
  server.close();
});

describe('Middleware de seguridad', () => {
  it('should include security headers (Helmet)', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-xss-protection']).toBe('0');
    expect(res.headers['strict-transport-security']).toBeDefined();
  });

  it('should accept requests with CORS headers', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:3000');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('should reject requests with invalid JSON body', async () => {
    const res = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('not-json');

    // Express 5 devuelve 500 para JSON malformado (el error handler global lo captura)
    expect(res.status).toBe(500);
  });

  it('should handle 404 for unknown routes', async () => {
    const res = await request(app).get('/api/ruta-inexistente');

    expect(res.status).toBe(404);
  });
});
