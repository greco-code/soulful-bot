import { Pool } from 'pg';
import { config } from 'dotenv';
import { logger } from "../utils";

config();

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
  // Connection pool settings for better stability
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const getDbClient = async () => {
  return pool.connect();
};

export const closeDb = async () => {
  logger.info('Closing database pool...');
  await pool.end();
  logger.info('Database pool closed');
};

export const initDb = async () => {
  const client = await getDbClient();

  try {
    // Initialize database schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        max_attendees INTEGER NOT NULL,
        message_id BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendees (
        id SERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL REFERENCES events(id),
        user_id BIGINT,
        name TEXT NOT NULL,
        guest_of_user_id BIGINT
      );
    `);
    
    // Add guest_of_user_id column if it doesn't exist (for existing databases)
    await client.query(`
      ALTER TABLE attendees 
      ADD COLUMN IF NOT EXISTS guest_of_user_id BIGINT;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL UNIQUE
      );
    `);

    logger.info('Database initialized successfully.');
  } catch (err) {
    logger.error('Failed to initialize database:', err);
    throw err; // Re-throw to trigger process exit
  } finally {
    client.release();
  }
};
