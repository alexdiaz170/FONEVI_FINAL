const { Pool } = require('pg');
require('dotenv').config();

let connectionString = process.env.DATABASE_URL;
if (connectionString) {
  // Strip out sslmode query parameter to prevent pg-connection-string overrides
  connectionString = connectionString.replace(/[?&]sslmode=[^&]+/g, '');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Force accept self-signed certificates for Supabase pooler
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('⚠️ Unexpected error on idle PostgreSQL client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  async transaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
  pool
};
