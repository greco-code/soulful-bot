import { logger } from "../utils";
import { getDbClient } from "./db";

export const getEventByMessageId = async (messageId: number) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to fetch event with message ID: ${messageId}`);
    const result = await client.query('SELECT * FROM events WHERE message_id = $1', [messageId]);
    logger.info(`Successfully fetched event with message ID: ${messageId}`);
    return result;
  } catch (err) {
    logger.error('Error fetching event:', err);
    return null;
  } finally {
    client.release();
  }
};

export const getEventById = async (eventId: string | number) => {
  const client = await getDbClient();
  try {
    logger.info(`Attempting to fetch event with ID: ${eventId}`);
    const result = await client.query('SELECT * FROM events WHERE id = $1', [eventId]);
    logger.info(`Successfully fetched event with ID: ${eventId}`);
    return result;
  } catch (err) {
    logger.error('Error fetching event:', err);
    return null;
  } finally {
    client.release();
  }
}

export const createEvent = async (description: string, maxAttendees: number) => {
  const client = await getDbClient();
  try {
    logger.info(`Creating event: "${description}" with max attendees: ${maxAttendees}`);
    return await client.query('INSERT INTO events (description, max_attendees) VALUES ($1, $2) RETURNING id', [description, maxAttendees]);
  } catch (err) {
    logger.error('Error creating event:', err);
    return null;
  } finally {
    client.release();
  }
}

export const updateEvent = async (eventId: string | number, messageId: string | number) => {
  const client = await getDbClient();
  try {
    logger.info(`Updating event with ID: ${eventId}`);
    await client.query('UPDATE events SET message_id = $1 WHERE id = $2', [messageId, eventId]);
    return true;
  } catch (err) {
    logger.error('Error updating event:', err);
    return false;
  } finally {
    client.release();
  }
}

export const updateEventDescription = async (eventId: string | number, description: string) => {
  const client = await getDbClient();
  try {
    logger.info(`Updating event description for event ID: ${eventId}`);
    await client.query('UPDATE events SET description = $1 WHERE id = $2', [description, eventId]);
    logger.info(`Successfully updated event description for event ID: ${eventId}`);
  } catch (err) {
    logger.error(`Error updating event description for event ID: ${eventId}`, err);
  } finally {
    client.release();
  }
};

export const updateEventMaxAttendees = async (eventId: string | number, maxAttendees: number) => {
  const client = await getDbClient();
  try {
    logger.info(`Updating max attendees for event ID: ${eventId}`);
    await client.query('UPDATE events SET max_attendees = $1 WHERE id = $2', [maxAttendees, eventId]);
    logger.info(`Successfully updated max attendees for event ID: ${eventId}`);
  } catch (err) {
    logger.error(`Error updating max attendees for event ID: ${eventId}`, err);
  } finally {
    client.release();
  }
};
