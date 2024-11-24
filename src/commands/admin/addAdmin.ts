import { logger } from '../../utils';
import { AdminService } from '../../services';
import { MessageText } from '../../const';
import { BotContext } from '../../types';

export const addAdminCommand = async (ctx: BotContext) => {
    logger.info('Received addAdmin command');

    const userId = ctx.validatedUserId!;
    const success = await AdminService.addAdmin(userId);

    if (success) {
        await ctx.reply(`${MessageText.AdminAdded} ID: ${userId}`, {
            message_thread_id: ctx.message?.message_thread_id
        });

        // Delete command message
        if (ctx.message?.message_id && ctx.chat?.id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            logger.info(`Deleted addAdmin command message from user ${ctx.from?.id}`);
        }
    } else {
        await ctx.reply(MessageText.AdminAlreadyAdded, {
            message_thread_id: ctx.message?.message_thread_id
        });
    }
};
