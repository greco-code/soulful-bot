import { Context } from 'grammy';
import { logger } from '../utils';
import { EventService, PlayerService } from '../services';
import { Action, MessageText } from '../const';
import { updateAttendeeList } from '../utils';

export const handleCallbackQuery = async (ctx: Context) => {
    logger.info('Received callback query');

    try {
        const callbackData = ctx.callbackQuery?.data;
        const userId = ctx.from?.id;

        if (!callbackData) {
            logger.warn('Callback query data is missing');
            await ctx.answerCallbackQuery({ text: MessageText.InvalidAction });
            return;
        }

        if (!userId) {
            logger.warn('User ID is missing in the callback query');
            await ctx.answerCallbackQuery({ text: MessageText.UserNotFound });
            return;
        }

        const [action, eventId] = callbackData.split(':');
        logger.info(`Processing action "${action}" for event ID ${eventId} by user ${userId}`);

        const event = await EventService.getEventById(eventId);
        if (!event) {
            logger.warn(`Event ID ${eventId} not found`);
            await ctx.answerCallbackQuery({ text: MessageText.EventNotFound });
            return;
        }

        const isRegistered = await PlayerService.checkPlayerRegistration(eventId, userId);

        if (action === Action.Register) {
            if (isRegistered) {
                logger.info(`User ${userId} is already registered for event ID ${eventId}`);
                await ctx.answerCallbackQuery({ text: MessageText.AlreadyRegistered });
                return;
            }

            const canRegister = await PlayerService.canRegisterForEvent(event);
            if (!canRegister) {
                logger.info(`Event ID ${eventId} is full. User ${userId} cannot register`);
                await ctx.answerCallbackQuery({ text: MessageText.EventFull });
                return;
            }

            const playerName = `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim();
            const success = await PlayerService.addFullPlayerToEvent(eventId, userId, playerName);

            if (!success) {
                await ctx.answerCallbackQuery({ text: MessageText.Error });
                return;
            }

            await ctx.answerCallbackQuery({ text: MessageText.RSVPConfirmed });

        } else if (action === Action.Unregister) {
            if (!isRegistered) {
                logger.info(`User ${userId} is not registered for event ID ${eventId}`);
                await ctx.answerCallbackQuery({ text: MessageText.NotRegistered });
                return;
            }

            const success = await PlayerService.removePlayerFromEventById(eventId, userId);

            if (!success) {
                await ctx.answerCallbackQuery({ text: MessageText.Error });
                return;
            }

            await ctx.answerCallbackQuery({ text: MessageText.RSVCanceled });
        }

        await updateAttendeeList(ctx, parseInt(eventId), ctx.chatId, ctx.callbackQuery?.message?.message_id);
        logger.info(`Updated attendee list for event ID ${eventId}`);

    } catch (error) {
        logger.error('Error handling callback query:', error);
        await ctx.answerCallbackQuery({ text: MessageText.Error }).catch(() => {});
    }
};
