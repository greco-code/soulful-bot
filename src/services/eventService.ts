import { logger } from '../utils';
import { createEvent, getEventById, getEventByMessageId, updateEvent, updateEventDescription, updateEventMaxAttendees } from '../db';
import { Event } from '../models/event';

export class EventService {
    static async createEvent(description: string, maxAttendees: number, messageId?: number): Promise<Event | null> {
        try {
            const result = await createEvent(description, maxAttendees);
            if (!result?.rows?.[0]) {
                logger.error('Failed to create event - no result returned');
                return null;
            }

            const event = result.rows[0];

            if (messageId) {
                await updateEvent(event.id, messageId);
            }

            logger.info(`Event created successfully with ID: ${event.id}`);
            return event;
        } catch (error) {
            logger.error('Error in EventService.createEvent:', error);
            return null;
        }
    }

    static async getEventById(eventId: string | number): Promise<Event | null> {
        try {
            const result = await getEventById(eventId);
            if (!result?.rows?.[0]) {
                logger.warn(`Event not found with ID: ${eventId}`);
                return null;
            }
            return result.rows[0];
        } catch (error) {
            logger.error('Error in EventService.getEventById:', error);
            return null;
        }
    }

    static async getEventByMessageId(messageId: number): Promise<Event | null> {
        try {
            const result = await getEventByMessageId(messageId);
            if (!result?.rows?.[0]) {
                logger.warn(`Event not found with message ID: ${messageId}`);
                return null;
            }
            return result.rows[0];
        } catch (error) {
            logger.error('Error in EventService.getEventByMessageId:', error);
            return null;
        }
    }

    static async updateEventDescription(eventId: string | number, description: string): Promise<boolean> {
        try {
            await updateEventDescription(eventId, description);
            logger.info(`Event description updated for event ID: ${eventId}`);
            return true;
        } catch (error) {
            logger.error('Error in EventService.updateEventDescription:', error);
            return false;
        }
    }

    static async updateEventMaxAttendees(eventId: string | number, maxAttendees: number): Promise<boolean> {
        try {
            await updateEventMaxAttendees(eventId, maxAttendees);
            logger.info(`Event max attendees updated for event ID: ${eventId}`);
            return true;
        } catch (error) {
            logger.error('Error in EventService.updateEventMaxAttendees:', error);
            return false;
        }
    }
}
