import { Context, InlineKeyboard } from 'grammy';
import {logger} from '../utils';
import { getDbClient } from '../db';
import { ButtonText, MessageText, Action } from '../const';

export const eventCommand = async (ctx: Context) => {
  logger.info('Received event creation command');

  const args = ctx.message?.text?.split(' ').slice(1);

  if (!args || args.length === 0) {
    logger.warn('No event information provided');
    await ctx.reply(MessageText.ProvideEventInfo);
    return;
  }

  const maxAttendees = parseInt(args[args.length - 1]);
  const eventDescription = args.slice(0, -1).join(' ').replace(/"/g, '');

  if (isNaN(maxAttendees)) {
    logger.warn('Invalid number of attendees provided');
    await ctx.reply(MessageText.InvalidNumber);
    return;
  }

  const db = await getDbClient();
  try {
    logger.info(`Creating event: "${eventDescription}" with max attendees: ${maxAttendees}`);

    const result = await db.query(
        'INSERT INTO events (description, max_attendees) VALUES ($1, $2) RETURNING id',
        [eventDescription, maxAttendees]
    );

    const eventId = result.rows[0].id;
    logger.info(`Event created with ID: ${eventId}`);

    const keyboard = new InlineKeyboard()
        .text(ButtonText.Register, `${Action.Register}:${eventId}`)
        .text(ButtonText.Unregister, `${Action.Unregister}:${eventId}`);

    const messageThreadId = ctx.message?.message_thread_id;

    const message = await ctx.reply(`${eventDescription}`, {
      reply_markup: keyboard,
      parse_mode: 'HTML',
      message_thread_id: messageThreadId,
    });

    logger.info(`Event message sent with ID: ${message.message_id}`);

    await db.query('UPDATE events SET message_id = $1 WHERE id = $2', [message.message_id, eventId]);
    logger.info(`Event ID ${eventId} updated with message ID ${message.message_id}`);

    if (ctx.message?.message_id && ctx.chat?.id) {
      await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
      logger.info(`Deleted command message with ID: ${ctx.message.message_id}`);
    }
  } catch (err) {
    logger.error('Error creating event:', err);
    await ctx.reply(MessageText.Error);
  } finally {
    db.release();
    logger.info('Database connection released after event creation');
  }
};
