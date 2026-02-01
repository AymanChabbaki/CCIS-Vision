const { Pool } = require('pg');
const logger = require('../utils/logger');

// Check if DATABASE_URL is provided (production, Neon/Supabase)
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

// PostgreSQL connection pool configuration
// For Vercel serverless: use max: 1 connection to avoid pool exhaustion
const pool = new Pool(
  databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false,
        },
        max: isProduction ? 1 : 20, // 1 connection for serverless, 20 for local
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'ccis_vision',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

// Test database connection
pool.on('connect', () => {
  logger.info('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
  process.exit(-1);
});

// Query helper function with logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Database query error:', { text, error: error.message });
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Test connection function
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as now, version() as version');
    logger.info('Database connection test successful', {
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(',')[0]
    });
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
