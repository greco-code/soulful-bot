import { logger } from '../utils';
import {
    getPlayerById,
    getPlayerByName,
    getPlayersCount,
    addPlayerToEvent,
    addFullPlayerToEvent,
    removePlayerFromEventByName,
    removePlayerFromEventById
} from '../db';
import { Event } from '../models/event';

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
}
