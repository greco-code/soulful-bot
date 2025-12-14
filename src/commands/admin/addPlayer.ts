import { logger } from '../../utils';
import { EventService, PlayerService } from '../../services';
import { MessageText } from '../../const';
import { updateAttendeeList } from '../../utils';
import { BotContext } from '../../types';

export const addPlayerCommand = async (ctx: BotContext) => {
    logger.info('Received addPlayer command');

    const name = ctx.playerName!;
    const messageId = ctx.eventMessageId!;

    const event = await EventService.getEventByMessageId(messageId);
    if (!event) {
        await ctx.reply(MessageText.EventNotFound, {
            message_thread_id: ctx.message?.message_thread_id
        });
        
        // Delete command message
        if (ctx.message?.message_id && ctx.chat?.id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            logger.info(`Deleted addPlayer command message from user ${ctx.from?.id}`);
        }
        return;
    }

    const success = await PlayerService.addPlayerToEvent(event.id, name);

    if (success) {
        await updateAttendeeList(ctx, event.id, ctx.chat?.id, messageId);

        // Delete command message
        if (ctx.message?.message_id && ctx.chat?.id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            logger.info(`Deleted addPlayer command message from user ${ctx.from?.id}`);
        }
    } else {
        await ctx.reply(MessageText.PlayerAlreadyInList, {
            message_thread_id: ctx.message?.message_thread_id
        });

        // Delete command message
        if (ctx.message?.message_id && ctx.chat?.id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            logger.info(`Deleted addPlayer command message from user ${ctx.from?.id}`);
        }
    }
};
