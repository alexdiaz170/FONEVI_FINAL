const { spawnSync } = require('child_process');
const path = require('path');

const seedPath = path.resolve(__dirname, '..', 'prisma', 'seed.js');

test('seed aborts when NODE_ENV=production', () => {
  const env = { ...process.env, NODE_ENV: 'production', REQUIRED_RUN_SEED: 'true' };
  const res = spawnSync(process.execPath, [seedPath], { env, encoding: 'utf8', timeout: 20000 });
  expect(res.status).not.toBe(0);
  const out = (res.stdout || '') + (res.stderr || '');
  expect(out).toMatch(/Refusing to run seed in production/);
});

test('seed aborts in development without REQUIRED_RUN_SEED', () => {
  const env = { ...process.env, NODE_ENV: 'development' };
  delete env.REQUIRED_RUN_SEED;
  const res = spawnSync(process.execPath, [seedPath], { env, encoding: 'utf8', timeout: 20000 });
  expect(res.status).not.toBe(0);
  const out = (res.stdout || '') + (res.stderr || '');
  expect(out).toMatch(/REQUIRED_RUN_SEED/);
});

// Optional integration run: only executes when TEST_DATABASE_URL is provided.
const TEST_DB = process.env.TEST_DATABASE_URL;
const maybe = TEST_DB ? test : test.skip;
maybe('seed runs in development with REQUIRED_RUN_SEED and TEST_DATABASE_URL', () => {
  const env = { ...process.env, NODE_ENV: 'development', REQUIRED_RUN_SEED: 'true', DATABASE_URL: TEST_DB };
  const res = spawnSync(process.execPath, [seedPath], { env, encoding: 'utf8', timeout: 120000 });
  // Expect non-sensitive output and exit code 0
  expect(res.status).toBe(0);
});
