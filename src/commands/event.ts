import { Context, InlineKeyboard } from 'grammy';
import { logger } from '../utils';
import { EventService } from '../services';
import { ButtonText, MessageText, Action } from '../const';

export const eventCommand = async (ctx: Context) => {
  logger.info('Received event creation command');

  const args = ctx.message?.text?.split(' ').slice(1);

  if (!args || args.length === 0) {
    logger.warn('No event information provided');
    await ctx.reply(MessageText.ProvideEventInfo, {
      message_thread_id: ctx.message?.message_thread_id
    });
    return;
  }

  const maxAttendees = parseInt(args[args.length - 1]);
  const eventDescription = args.slice(0, -1).join(' ').replace(/"/g, '');

  if (isNaN(maxAttendees)) {
    logger.warn('Invalid number of attendees provided');
    await ctx.reply(MessageText.InvalidNumber, {
      message_thread_id: ctx.message?.message_thread_id
    });
    return;
  }

  try {
    const keyboard = new InlineKeyboard()
      .text(ButtonText.Register, `${Action.Register}:`)
      .text(ButtonText.Unregister, `${Action.Unregister}:`);

    const messageThreadId = ctx.message?.message_thread_id;

    const message = await ctx.reply(`${eventDescription}`, {
      reply_markup: keyboard,
      parse_mode: 'HTML',
      message_thread_id: messageThreadId,
    });

    logger.info(`Event message sent with ID: ${message.message_id}`);

    const event = await EventService.createEvent(eventDescription, maxAttendees, message.message_id);

    if (event) {
      // Update keyboard with actual event ID
      const updatedKeyboard = new InlineKeyboard()
        .text(ButtonText.Register, `${Action.Register}:${event.id}`)
        .text(ButtonText.Unregister, `${Action.Unregister}:${event.id}`);

      await ctx.api.editMessageReplyMarkup(ctx.chat?.id || 0, message.message_id, {
        reply_markup: updatedKeyboard
      });

      logger.info(`Event ID ${event.id} updated with message ID ${message.message_id}`);
    } else {
      logger.error('Failed to create event');
      await ctx.reply(MessageText.Error, {
        message_thread_id: ctx.message?.message_thread_id
      });
      return;
    }

    if (ctx.message?.message_id && ctx.chat?.id) {
      await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
      logger.info(`Deleted command message with ID: ${ctx.message.message_id}`);
    }
  } catch (err) {
    logger.error('Error creating event:', err);
    await ctx.reply(MessageText.Error, {
      message_thread_id: ctx.message?.message_thread_id
    });
  }
};
