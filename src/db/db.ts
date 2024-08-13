import {Pool} from 'pg';
import {config} from 'dotenv';
import {logger} from "../utils";

config();

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export const getDbClient = async () => {
  return pool.connect();
};

export const initDb = async () => {
  const client = await getDbClient();

  try {
    // Initialize your database schema
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
        name TEXT NOT NULL
      );
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
  } finally {
    client.release();
  }
};
