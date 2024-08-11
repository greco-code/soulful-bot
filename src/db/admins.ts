import {getDbClient} from './db';

export const addAdmin = async (userId: number) => {
  const client = await getDbClient();
  try {
    await client.query('INSERT INTO admins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);
  } catch (err) {
    console.error('Error adding admin:', err);
  } finally {
    client.release();
  }
};

export const removeAdmin = async (userId: number) => {
  const client = await getDbClient();
  try {
    await client.query('DELETE FROM admins WHERE user_id = $1', [userId]);
  } catch (err) {
    console.error('Error removing admin:', err);
  } finally {
    client.release();
  }
};

export const isAdmin = async (userId: number): Promise<boolean> => {
  const client = await getDbClient();
  try {
    const result = await client.query('SELECT * FROM admins WHERE user_id = $1', [userId]);
    return result.rows.length > 0;
  } catch (err) {
    console.error('Error checking admin status:', err);
    return false;
  } finally {
    client.release();
  }
};
