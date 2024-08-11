import { Context, InlineKeyboard } from 'grammy';
import { openDb } from '../db';
import { ButtonText, MessageText, Action } from '../const';

export const eventCommand = async (ctx: Context) => {
  const args = ctx.message?.text?.split(' ').slice(1);

  if (!args || args.length === 0) {
    ctx.reply(MessageText.ProvideEventInfo);
    return;
  }

  const maxAttendees = parseInt(args[args.length - 1]);
  const eventDescription = args.slice(0, -1).join(' ').replace(/"/g, '');

  if (isNaN(maxAttendees)) {
    ctx.reply(MessageText.InvalidNumber);
    return;
  }

  const db = await openDb();
  const result = await db.run('INSERT INTO events (description, max_attendees) VALUES (?, ?)', [
    eventDescription,
    maxAttendees,
  ]);

  const keyboard = new InlineKeyboard()
      .text(ButtonText.Register, `${Action.Register}:${result.lastID}`)
      .text(ButtonText.Unregister, `${Action.Unregister}:${result.lastID}`);

  const message = await ctx.reply(`${eventDescription}`, {
    reply_markup: keyboard,
    parse_mode: 'HTML',
  });

  await db.run('UPDATE events SET message_id = ? WHERE id = ?', [message.message_id, result.lastID]);

  if (ctx.message?.message_id && ctx.chat?.id) {
    await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
  }
};
