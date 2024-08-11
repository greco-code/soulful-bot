import {Context, InlineKeyboard} from 'grammy';
import {getDbClient} from '../db';
import {ButtonText, MessageText, Action} from '../const';

export const eventCommand = async (ctx: Context) => {
  const args = ctx.message?.text?.split(' ').slice(1);

  if (!args || args.length === 0) {
    await ctx.reply(MessageText.ProvideEventInfo);
    return;
  }

  const maxAttendees = parseInt(args[args.length - 1]);
  const eventDescription = args.slice(0, -1).join(' ').replace(/"/g, '');

  if (isNaN(maxAttendees)) {
    await ctx.reply(MessageText.InvalidNumber);
    return;
  }

  const db = await getDbClient();
  try {
    const result = await db.query(
        'INSERT INTO events (description, max_attendees) VALUES ($1, $2) RETURNING id',
        [eventDescription, maxAttendees]
    );

    const eventId = result.rows[0].id;

    const keyboard = new InlineKeyboard()
        .text(ButtonText.Register, `${Action.Register}:${eventId}`)
        .text(ButtonText.Unregister, `${Action.Unregister}:${eventId}`);

    const messageThreadId = ctx.message?.message_thread_id;

    const message = await ctx.reply(`${eventDescription}`, {
      reply_markup: keyboard,
      parse_mode: 'HTML',
      message_thread_id: messageThreadId,
    });

    await db.query('UPDATE events SET message_id = $1 WHERE id = $2', [message.message_id, eventId]);

    if (ctx.message?.message_id && ctx.chat?.id) {
      await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
    }
  } catch (err) {
    console.error('Error creating event:', err);
    await ctx.reply(MessageText.Error);
  } finally {
    db.release();
  }
};
