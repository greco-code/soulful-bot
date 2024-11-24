import {logger} from '../utils';
import {getDbClient} from './db';

export const addAdmin = async (userId: number) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to add admin with ID: ${userId}`);
    await client.query('INSERT INTO admins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);
    logger.info(`Successfully added admin with ID: ${userId}`);
  } catch (err) {
    logger.error('Error adding admin:', err);
  } finally {
    client.release();
  }
};

export const removeAdmin = async (userId: number) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to remove admin with ID: ${userId}`);
    await client.query('DELETE FROM admins WHERE user_id = $1', [userId]);
    logger.info(`Successfully removed admin with ID: ${userId}`);
  } catch (err) {
    logger.error('Error removing admin:', err);
  } finally {
    client.release();
  }
};

export const isAdmin = async (userId: number): Promise<boolean> => {
  const client = await getDbClient();
  try {
    logger.info(`Checking if user with ID: ${userId} is an admin`);
    const result = await client.query('SELECT * FROM admins WHERE user_id = $1', [userId]);
    const isAdmin = result.rows.length > 0;
    logger.info(`User with ID: ${userId} is ${isAdmin ? 'an admin' : 'not an admin'}`);
    return isAdmin;
  } catch (err) {
    logger.error('Error checking admin status:', err);
    return false;
  } finally {
    client.release();
  }
};

export const getAdminCount = async (): Promise<number> => {
  const client = await getDbClient();
  try {
    logger.info('Getting admin count');
    const result = await client.query('SELECT COUNT(*) as count FROM admins');
    const count = parseInt(result.rows[0].count, 10);
    logger.info(`Admin count: ${count}`);
    return count;
  } catch (err) {
    logger.error('Error getting admin count:', err);
    return 0;
  } finally {
    client.release();
  }
}
