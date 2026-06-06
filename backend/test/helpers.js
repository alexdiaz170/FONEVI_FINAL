require('dotenv').config();

const supertest = require('supertest');
const path = require('path');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const db = require('../src/db');

// Ensure test JWT secret
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

// Ensure TEST_DATABASE_URL exists (fall back to DATABASE_URL)
let TEST_DB = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (TEST_DB) {
  TEST_DB = TEST_DB.replace(/[?&]sslmode=[^&]+/g, '');
}

console.log('TEST_DB =', TEST_DB);
const pool = new Pool({
  connectionString: TEST_DB,
  ssl: {
    rejectUnauthorized: false
  }
});

// Require app after envs set
const app = require('../src/app');
const request = supertest(app);

function makeToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = {
  request,
  pool,
  makeToken,
  db
};
