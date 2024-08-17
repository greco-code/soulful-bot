import {Context} from 'grammy';
import {logger} from '../utils';
import {getDbClient} from '../db';
import {Action, MessageText} from '../const';
import {updateAttendeeList} from '../utils';

export const handleCallbackQuery = async (ctx: Context) => {
  logger.info('Received callback query');

  const callbackQuery = ctx.callbackQuery;

  if (!callbackQuery?.data) {
    logger.warn('Callback query data is missing');
    await ctx.answerCallbackQuery({text: MessageText.InvalidAction}).catch(error => {
      logger.error('Failed to answer callback query due to missing data:', error);
    });
    return;
  }

  const userId = ctx.from?.id;

  if (!userId) {
    logger.warn('User ID is missing in the callback query');
    await ctx.answerCallbackQuery({text: MessageText.UserNotFound}).catch(error => {
      logger.error('Failed to answer callback query due to missing user ID:', error);
    });
    return;
  }

  const [action, eventId] = callbackQuery.data.split(':');
  const dbClient = await getDbClient();

  try {
    logger.info(`Processing action "${action}" for event ID ${eventId} by user ${userId}`);

    const existingAttendee = await dbClient.query(
        'SELECT * FROM attendees WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
    );

    const eventResult = await dbClient.query('SELECT * FROM events WHERE id = $1', [eventId]);
    const event = eventResult.rows[0];

    if (!event) {
      logger.warn(`Event ID ${eventId} not found`);
      await ctx.answerCallbackQuery({text: MessageText.EventNotFound}).catch(error => {
        logger.error('Failed to answer callback query due to event not found:', error);
      });
      return;
    }

    const attendeeCountResult = await dbClient.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM attendees WHERE event_id = $1',
        [eventId]
    );
    const attendeeCount = attendeeCountResult.rows[0];

    if (!attendeeCount) {
      logger.warn(`Could not retrieve attendee count for event ID ${eventId}`);
      return;
    }

    if (action === Action.Register) {
      if (existingAttendee.rows.length > 0) {
        logger.info(`User ${userId} is already registered for event ID ${eventId}`);
        await ctx.answerCallbackQuery({text: MessageText.AlreadyRegistered}).catch(error => {
          logger.error('Failed to answer callback query due to existing registration:', error);
        });
        return;
      }

      if (attendeeCount.count >= event.max_attendees) {
        logger.info(`Event ID ${eventId} is full. User ${userId} cannot register`);
        await ctx.answerCallbackQuery({text: MessageText.EventFull}).catch(error => {
          logger.error('Failed to answer callback query due to full event:', error);
        });
        return;
      }

      await dbClient.query(
          'INSERT INTO attendees (event_id, user_id, name) VALUES ($1, $2, $3)',
          [eventId, userId, `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim()]
      );

      logger.info(`User ${userId} successfully registered for event ID ${eventId}`);
      await ctx.answerCallbackQuery({text: MessageText.RSVPConfirmed}).catch(error => {
        logger.error('Failed to confirm RSVP:', error);
      });
    } else if (action === Action.Unregister) {
      if (existingAttendee.rows.length === 0) {
        logger.info(`User ${userId} is not registered for event ID ${eventId}`);
        await ctx.answerCallbackQuery({text: MessageText.NotRegistered}).catch(error => {
          logger.error('Failed to answer callback query due to missing registration:', error);
        });
        return;
      }

      await dbClient.query('DELETE FROM attendees WHERE event_id = $1 AND user_id = $2', [
        eventId,
        userId,
      ]);

      logger.info(`User ${userId} successfully unregistered from event ID ${eventId}`);
      await ctx.answerCallbackQuery({text: MessageText.RSVCanceled}).catch(error => {
        logger.error('Failed to cancel RSVP:', error);
      });
    }

    await updateAttendeeList(ctx, parseInt(eventId), ctx.chatId, ctx.callbackQuery?.message?.message_id);
    logger.info(`Updated attendee list for event ID ${eventId}`);
  } catch (error) {
    logger.error('Error handling callback query:', error);
    await ctx.answerCallbackQuery({text: MessageText.Error}).catch(err => {
      logger.error('Failed to answer callback query due to an error:', err);
    });
  } finally {
    dbClient.release();
  }
};
