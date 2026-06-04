const supertest = require('supertest');
const path = require('path');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Ensure test JWT secret
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

// Ensure TEST_DATABASE_URL exists (fall back to DATABASE_URL)
const TEST_DB = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!TEST_DB) {
  console.warn('TEST_DATABASE_URL not set; database tests will be skipped or fail.');
}

const pool = new Pool({ connectionString: TEST_DB });

// Require app after envs set
const app = require('../src/app');
const request = supertest(app);

function makeToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = { request, pool, makeToken };
