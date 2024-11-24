import { logger } from '../../utils';
import { EventService } from '../../services';
import { MessageText } from '../../const';
import { BotContext } from '../../types';

export const updateMaxAttendeesCommand = async (ctx: BotContext) => {
    logger.info('Received updateMax command');

    const maxAttendees = parseInt(ctx.message?.text?.split(' ')[1] || '');
    const messageId = ctx.eventMessageId!;

    if (isNaN(maxAttendees) || maxAttendees <= 0) {
        logger.warn(`Invalid max attendees value provided: ${maxAttendees}`);
        await ctx.reply(MessageText.InvalidNumber, {
            message_thread_id: ctx.message?.message_thread_id
        });
        return;
    }

    const event = await EventService.getEventByMessageId(messageId);
    if (!event) {
        await ctx.reply(MessageText.EventNotFound, {
            message_thread_id: ctx.message?.message_thread_id
        });
        return;
    }

    const success = await EventService.updateEventMaxAttendees(event.id, maxAttendees);

    if (success) {
        logger.info(`Max attendees updated for event ID ${event.id}`);

        // Delete command message
        if (ctx.message?.message_id && ctx.chat?.id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            logger.info(`Deleted updateMax command message from user ${ctx.from?.id}`);
        }
    } else {
        await ctx.reply(MessageText.Error, {
            message_thread_id: ctx.message?.message_thread_id
        });
    }
};
