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
        // Get current message text to preserve attendee list if it exists
        const currentMessageText = ctx.message?.reply_to_message?.text || '';
        const attendeeListSeparator = `\n\n${MessageText.AttendeeList}\n`;
        
        // Check if message has attendee list
        const hasAttendeeList = currentMessageText.includes(attendeeListSeparator);
        let updatedMessageText = newDescription;
        
        if (hasAttendeeList) {
            // Preserve attendee list
            const attendeeListPart = currentMessageText.split(attendeeListSeparator)[1];
            updatedMessageText = `${newDescription}${attendeeListSeparator}${attendeeListPart}`;
        }

        // Preserve keyboard/reply_markup
        const replyMarkup = ctx.message?.reply_to_message?.reply_markup;

        await ctx.api.editMessageText(
            ctx.chat?.id || 0,
            messageId,
            updatedMessageText,
            {
                reply_markup: replyMarkup,
                parse_mode: 'HTML'
            }
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
