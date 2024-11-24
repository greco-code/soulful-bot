import { logger } from '../../utils';
import { EventService, PlayerService } from '../../services';
import { MessageText } from '../../const';
import { updateAttendeeList } from '../../utils';
import { BotContext } from '../../types';

export const removePlayerCommand = async (ctx: BotContext) => {
    logger.info('Received removePlayer command');

    const name = ctx.playerName!;
    const messageId = ctx.eventMessageId!;

    const event = await EventService.getEventByMessageId(messageId);
    if (!event) {
        await ctx.reply(MessageText.EventNotFound, {
            message_thread_id: ctx.message?.message_thread_id
        });
        return;
    }

    const success = await PlayerService.removePlayerFromEvent(event.id, name);

    if (success) {
        await updateAttendeeList(ctx, event.id, ctx.chat?.id, messageId);

        // Delete command message
        if (ctx.message?.message_id && ctx.chat?.id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            logger.info(`Deleted removePlayer command message from user ${ctx.from?.id}`);
        }
    } else {
        await ctx.reply(MessageText.PlayerNotInList, {
            message_thread_id: ctx.message?.message_thread_id
        });
    }
};
