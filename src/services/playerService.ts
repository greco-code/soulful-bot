import { logger } from '../utils';
import {
    getPlayerById,
    getPlayerByName,
    getPlayersCount,
    addPlayerToEvent,
    addFullPlayerToEvent,
    removePlayerFromEventByName,
    removePlayerFromEventById,
    addGuestToEvent,
    getGuestCountForUser,
    removeGuestFromEvent
} from '../db';
import { Event } from '../models/event';
import { EventService } from './eventService';

export class PlayerService {
    static async addPlayerToEvent(eventId: number, name: string): Promise<boolean> {
        try {
            const existingPlayer = await getPlayerByName(eventId, name);
            if (existingPlayer?.rows?.length && existingPlayer.rows.length > 0) {
                logger.info(`Player ${name} already exists in event ${eventId}`);
                return false;
            }

            await addPlayerToEvent(eventId, name);
            logger.info(`Player ${name} added to event ${eventId}`);
            return true;
        } catch (error) {
            logger.error('Error in PlayerService.addPlayerToEvent:', error);
            return false;
        }
    }

    static async addFullPlayerToEvent(eventId: string | number, userId: number, name: string): Promise<boolean> {
        try {
            const existingPlayer = await getPlayerById(eventId.toString(), userId);
            if (existingPlayer?.rows?.length && existingPlayer.rows.length > 0) {
                logger.info(`Player ${userId} already registered for event ${eventId}`);
                return false;
            }

            await addFullPlayerToEvent(eventId, userId, name);
            logger.info(`Player ${name} (${userId}) added to event ${eventId}`);
            return true;
        } catch (error) {
            logger.error('Error in PlayerService.addFullPlayerToEvent:', error);
            return false;
        }
    }

    static async removePlayerFromEvent(eventId: number, name: string): Promise<boolean> {
        try {
            const existingPlayer = await getPlayerByName(eventId, name);
            if (!existingPlayer?.rows?.length || existingPlayer.rows.length === 0) {
                logger.info(`Player ${name} not found in event ${eventId}`);
                return false;
            }

            await removePlayerFromEventByName(eventId, name);
            logger.info(`Player ${name} removed from event ${eventId}`);
            return true;
        } catch (error) {
            logger.error('Error in PlayerService.removePlayerFromEvent:', error);
            return false;
        }
    }

    static async removePlayerFromEventById(eventId: string | number, userId: string | number): Promise<boolean> {
        try {
            const existingPlayer = await getPlayerById(eventId.toString(), Number(userId));
            if (!existingPlayer?.rows?.length || existingPlayer.rows.length === 0) {
                logger.info(`Player ${userId} not registered for event ${eventId}`);
                return false;
            }

            await removePlayerFromEventById(eventId, userId);
            logger.info(`Player ${userId} removed from event ${eventId}`);
            return true;
        } catch (error) {
            logger.error('Error in PlayerService.removePlayerFromEventById:', error);
            return false;
        }
    }

    static async checkPlayerRegistration(eventId: string | number, userId: number): Promise<boolean> {
        try {
            const player = await getPlayerById(eventId.toString(), userId);
            return !!(player?.rows?.length && player.rows.length > 0);
        } catch (error) {
            logger.error('Error in PlayerService.checkPlayerRegistration:', error);
            return false;
        }
    }

    static async getEventAttendeeCount(eventId: string | number): Promise<number> {
        try {
            const result = await getPlayersCount(eventId);
            return result?.rows?.[0]?.count || 0;
        } catch (error) {
            logger.error('Error in PlayerService.getEventAttendeeCount:', error);
            return 0;
        }
    }

    static async canRegisterForEvent(event: Event): Promise<boolean> {
        try {
            const currentCount = await this.getEventAttendeeCount(event.id);
            return currentCount < event.max_attendees;
        } catch (error) {
            logger.error('Error in PlayerService.canRegisterForEvent:', error);
            return false;
        }
    }

    static async addGuestToEvent(eventId: string | number, userId: number, userName: string): Promise<boolean> {
        try {
            // Check if user is registered first
            const isRegistered = await this.checkPlayerRegistration(eventId, userId);
            if (!isRegistered) {
                logger.info(`User ${userId} is not registered for event ${eventId}, cannot add guest`);
                return false;
            }

            // Check if event has space
            const event = await EventService.getEventById(eventId);
            if (!event) {
                logger.warn(`Event ${eventId} not found`);
                return false;
            }

            const currentCount = await this.getEventAttendeeCount(eventId);
            if (currentCount >= event.max_attendees) {
                logger.info(`Event ${eventId} is full, cannot add guest`);
                return false;
            }

            const guestName = `${userName}'s +1`;
            await addGuestToEvent(eventId, userId, guestName);
            logger.info(`Guest added for user ${userId} to event ${eventId}`);
            return true;
        } catch (error) {
            logger.error('Error in PlayerService.addGuestToEvent:', error);
            return false;
        }
    }

    static async removeGuestFromEvent(eventId: string | number, userId: number): Promise<boolean> {
        try {
            const success = await removeGuestFromEvent(eventId, userId);
            if (success) {
                logger.info(`Guest removed for user ${userId} from event ${eventId}`);
            } else {
                logger.info(`No guest found to remove for user ${userId} in event ${eventId}`);
            }
            return success;
        } catch (error) {
            logger.error('Error in PlayerService.removeGuestFromEvent:', error);
            return false;
        }
    }

    static async getGuestCountForUser(eventId: string | number, userId: number): Promise<number> {
        try {
            return await getGuestCountForUser(eventId, userId);
        } catch (error) {
            logger.error('Error in PlayerService.getGuestCountForUser:', error);
            return 0;
        }
    }
}
