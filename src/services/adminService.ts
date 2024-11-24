import { logger } from '../utils';
import { addAdmin as addAdminToDb, removeAdmin as removeAdminFromDb, isAdmin, getAdminCount as getAdminCountFromDb } from '../db';

export class AdminService {
    static async addAdmin(userId: number): Promise<boolean> {
        try {
            const isUserAlreadyAdmin = await isAdmin(userId);
            if (isUserAlreadyAdmin) {
                logger.info(`User ID ${userId} is already an admin`);
                return false;
            }

            await addAdminToDb(userId);
            logger.info(`Admin added successfully with ID: ${userId}`);
            return true;
        } catch (error) {
            logger.error('Error in AdminService.addAdmin:', error);
            return false;
        }
    }

    static async removeAdmin(userId: number): Promise<boolean> {
        try {
            const isUserAdmin = await isAdmin(userId);
            if (!isUserAdmin) {
                logger.info(`User ID ${userId} is not an admin`);
                return false;
            }

            const adminCount = await getAdminCountFromDb();
            if (adminCount <= 1) {
                logger.warn('Cannot remove the last admin');
                return false;
            }

            await removeAdminFromDb(userId);
            logger.info(`Admin removed successfully with ID: ${userId}`);
            return true;
        } catch (error) {
            logger.error('Error in AdminService.removeAdmin:', error);
            return false;
        }
    }

    static async checkAdminStatus(userId: number): Promise<boolean> {
        try {
            return await isAdmin(userId);
        } catch (error) {
            logger.error('Error in AdminService.checkAdminStatus:', error);
            return false;
        }
    }

    static async getAdminCount(): Promise<number> {
        try {
            return await getAdminCountFromDb();
        } catch (error) {
            logger.error('Error in AdminService.getAdminCount:', error);
            return 0;
        }
    }
}
