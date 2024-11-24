import { Context } from 'grammy';
import { logger } from '../utils';
import { AdminService } from '../services';
import { MessageText } from '../const';

export const requireAdmin = async (ctx: Context, next: () => Promise<void>) => {
    try {
        const userId = ctx.from?.id;

        if (!userId) {
            logger.warn('Admin check failed: No user ID found');
            await ctx.reply(MessageText.UserNotFound, { message_thread_id: ctx.message?.message_thread_id });
            return;
        }

        const isUserAdmin = await AdminService.checkAdminStatus(userId);

        if (!isUserAdmin) {
            logger.warn(`User ${userId} attempted admin action without sufficient rights`);
            await ctx.reply(MessageText.NoAccess, { message_thread_id: ctx.message?.message_thread_id });
            return;
        }

        logger.debug(`Admin action authorized for user ${userId}`);
        await next();

    } catch (error) {
        logger.error('Error in requireAdmin middleware:', error);

        try {
            await ctx.reply(MessageText.Error, { message_thread_id: ctx.message?.message_thread_id });
        } catch (replyError) {
            logger.error('Failed to send error reply:', replyError);
        }
    }
};
