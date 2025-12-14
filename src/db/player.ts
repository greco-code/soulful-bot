import { getDbClient } from "./db";
import { logger } from "../utils";

export const getPlayerByName = async (eventId: string | number, name: string) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to fetch player ${name} for event with ID: ${eventId}`);
    const result = await client.query('SELECT * FROM attendees WHERE event_id = $1 AND name = $2', [
      eventId,
      name,
    ]);
    logger.info(`Successfully fetched player ${name} for event with ID: ${eventId}`);
    return result;
  } catch (err) {
    logger.error('Error fetching players:', err);
    return null;
  } finally {
    client.release();
  }
}
export const getPlayerById = async (eventId: string, userId: number) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to fetch player with ID: ${userId} for event with ID: ${eventId}`);
    const result = await client.query('SELECT * FROM attendees WHERE event_id = $1 AND user_id = $2', [
      eventId,
      userId,
    ]);
    logger.info(`Successfully fetched player with ID: ${userId} for event with ID: ${eventId}`);
    return result;
  } catch (err) {
    logger.error('Error fetching players:', err);
    return null;
  } finally {
    client.release();
  }
};
export const getPlayersCount = async (eventId: string | number) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to fetch players count for event with ID: ${eventId}`);
    const result = await client.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM attendees WHERE event_id = $1',
      [eventId]
    );
    logger.info(`Successfully fetched players count for event with ID: ${eventId}`);
    return result;
  } catch (err) {
    logger.error('Error fetching players count:', err);
    return null;
  } finally {
    client.release();
  }
}
export const addPlayerToEvent = async (eventId: number, name: string) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to add player ${name} to event with ID: ${eventId}`);
    await client.query('INSERT INTO attendees (event_id, user_id, name) VALUES ($1, NULL, $2)', [
      eventId,
      name,
    ]);
    logger.info(`Player ${name} added to event ID ${eventId}`);
  } catch (err) {
    logger.error('Error adding player to event:', err);
  } finally {
    client.release();
  }
};
export const addFullPlayerToEvent = async (eventId: string | number, userId: number, name: string) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to add player ${name} to event with ID: ${eventId}`);
    await client.query('INSERT INTO attendees (event_id, user_id, name) VALUES ($1, $2, $3)', [
      eventId,
      userId,
      name,
    ]);
    logger.info(`Player ${name} ${userId} added to event ID ${eventId}`);
  } catch (err) {
    logger.error('Error adding player to event:', err);
  } finally {
    client.release();
  }
}
export const removePlayerFromEventByName = async (eventId: number, name: string) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to remove player ${name} from event with ID: ${eventId}`);
    await client.query('DELETE FROM attendees WHERE event_id = $1 AND name = $2', [eventId, name]);
    logger.info(`Player ${name} removed from event ID ${eventId}`);
  } catch (err) {
    logger.error('Error removing player from event:', err);
  } finally {
    client.release();
  }
};
export const removePlayerFromEventById = async (eventId: string | number, userId: string | number) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to remove player ${userId} from event with ID: ${eventId}`);
    // Remove the player and all their guests
    await client.query(
      'DELETE FROM attendees WHERE event_id = $1 AND (user_id = $2 OR guest_of_user_id = $2)',
      [eventId, userId]
    );
    logger.info(`Player ${userId} and their guests removed from event ID ${eventId}`);
  } catch (err) {
    logger.error('Error removing player from event:', err);
  } finally {
    client.release();
  }
};

export const getEventAttendeesWithUserId = async (eventId: string | number) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to fetch attendees with user_id for event ID: ${eventId}`);
    const result = await client.query(
      'SELECT user_id, name FROM attendees WHERE event_id = $1 AND user_id IS NOT NULL',
      [eventId]
    );
    logger.info(`Successfully fetched ${result.rows.length} attendees with user_id for event ID: ${eventId}`);
    return result;
  } catch (err) {
    logger.error('Error fetching attendees with user_id:', err);
    return null;
  } finally {
    client.release();
  }
};

export const addGuestToEvent = async (eventId: string | number, userId: number, guestName: string) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to add guest ${guestName} for user ${userId} to event ID: ${eventId}`);
    await client.query(
      'INSERT INTO attendees (event_id, user_id, name, guest_of_user_id) VALUES ($1, NULL, $2, $3)',
      [eventId, guestName, userId]
    );
    logger.info(`Guest ${guestName} added for user ${userId} to event ID: ${eventId}`);
  } catch (err) {
    logger.error('Error adding guest to event:', err);
    throw err;
  } finally {
    client.release();
  }
};

export const getGuestCountForUser = async (eventId: string | number, userId: number) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to get guest count for user ${userId} in event ID: ${eventId}`);
    const result = await client.query(
      'SELECT COUNT(*) as count FROM attendees WHERE event_id = $1 AND guest_of_user_id = $2',
      [eventId, userId]
    );
    const count = parseInt(result.rows[0]?.count || '0', 10);
    logger.info(`User ${userId} has ${count} guests in event ID: ${eventId}`);
    return count;
  } catch (err) {
    logger.error('Error getting guest count:', err);
    return 0;
  } finally {
    client.release();
  }
};

export const removeGuestFromEvent = async (eventId: string | number, userId: number) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to remove one guest for user ${userId} from event ID: ${eventId}`);
    const result = await client.query(
      'DELETE FROM attendees WHERE event_id = $1 AND guest_of_user_id = $2 AND id = (SELECT id FROM attendees WHERE event_id = $1 AND guest_of_user_id = $2 LIMIT 1)',
      [eventId, userId]
    );
    const deleted = result.rowCount || 0;
    logger.info(`Removed ${deleted} guest(s) for user ${userId} from event ID: ${eventId}`);
    return deleted > 0;
  } catch (err) {
    logger.error('Error removing guest from event:', err);
    return false;
  } finally {
    client.release();
  }
};