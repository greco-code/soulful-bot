import { openDb } from './db';

export const addAdmin = async (userId: number) => {
  const db = await openDb();
  await db.run('INSERT OR IGNORE INTO admins (user_id) VALUES (?)', [userId]);
};

export const removeAdmin = async (userId: number) => {
  const db = await openDb();
  await db.run('DELETE FROM admins WHERE user_id = ?', [userId]);
};

export const isAdmin = async (userId: number): Promise<boolean> => {
  const db = await openDb();
  const result = await db.get('SELECT * FROM admins WHERE user_id = ?', [userId]);
  return !!result;
};
