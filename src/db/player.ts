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
    await client.query('DELETE FROM attendees WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
    logger.info(`Player ${userId} removed from event ID ${eventId}`);
  } catch (err) {
    logger.error('Error removing player from event:', err);
  } finally {
    client.release();
  }
};