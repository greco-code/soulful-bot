import { logger } from '../../utils';
import { EventService } from '../../services';
import { MessageText } from '../../const';
import { BotContext } from '../../types';

export const updateDescriptionCommand = async (ctx: BotContext) => {
    logger.info('Received updateDescription command');

    const newDescription = ctx.message?.text?.split(' ').slice(1).join(' ').trim();
    const messageId = ctx.eventMessageId!;

    if (!newDescription) {
        await ctx.reply(MessageText.NewDescriptionNeeded, {
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

    const success = await EventService.updateEventDescription(event.id, newDescription);

    if (success) {
        await ctx.api.editMessageText(
            ctx.chat?.id || 0,
            messageId,
            `📅 Event Updated: ${newDescription}\n🧑‍🤝‍🧑 Max Attendees: ${event.max_attendees}`
        );

        logger.info(`Updated description for event ID: ${event.id}`);

        // Delete command message
        if (ctx.message?.message_id && ctx.chat?.id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            logger.info(`Deleted updateDescription command message from user ${ctx.from?.id}`);
        }
    } else {
        await ctx.reply(MessageText.Error, {
            message_thread_id: ctx.message?.message_thread_id
        });
    }
};
