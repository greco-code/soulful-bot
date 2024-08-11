import {Context} from 'grammy';
import {openDb} from '../db/db';
import {Action, ButtonText, MessageText} from '../const';

export const handleCallbackQuery = async (ctx: Context) => {
  const callbackQuery = ctx.callbackQuery;

  if (!callbackQuery?.data) {
    await ctx.answerCallbackQuery({text: MessageText.InvalidAction});
    return;
  }
  const userId = ctx.from?.id;

  if (!userId) {
    await ctx.answerCallbackQuery({text: MessageText.UserNotFound});
    return;
  }

  const [action, eventId] = callbackQuery.data.split(':');
  const db = await openDb();

  const existingAttendee = await db.get('SELECT * FROM attendees WHERE event_id = ? AND user_id = ?', [
    eventId,
    userId,
  ]);

  const event = await db.get('SELECT * FROM events WHERE id = ?', [eventId]);

  if (!event) {
    ctx.answerCallbackQuery({text: MessageText.EventNotFound});
    return;
  }

  const attendeeCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM attendees WHERE event_id = ?', [
    eventId,
  ]);

  if (!attendeeCount) {
    return;
  }

  if (action === Action.Register) {
    if (existingAttendee) {
      ctx.answerCallbackQuery({text: MessageText.AlreadyRegistered});
      return;
    }

    if (attendeeCount.count >= event.max_attendees) {
      ctx.answerCallbackQuery({text: MessageText.EventFull});
      return;
    }

    await db.run('INSERT INTO attendees (event_id, user_id, name) VALUES (?, ?, ?)', [
      eventId,
      userId,
      `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim(),
    ]);

    ctx.answerCallbackQuery({text: MessageText.RSVPConfirmed});
  } else if (action === Action.Unregister) {
    if (!existingAttendee) {
      ctx.answerCallbackQuery({text: MessageText.NotRegistered});
      return;
    }

    await db.run('DELETE FROM attendees WHERE event_id = ? AND user_id = ?', [
      eventId,
      userId,
    ]);

    ctx.answerCallbackQuery({text: MessageText.RSVCanceled});
  }

  const attendees = await db.all('SELECT name, user_id FROM attendees WHERE event_id = ?', [eventId]);

  const attendeeList = await Promise.all(
      attendees.map(async (row: { name: string; user_id: number }, index: number) => {
        try {
          if (!ctx.chat) {
            return;
          }

          const user = await ctx.api.getChatMember(ctx.chat.id, row.user_id);
          const username = user.user.username ? ` (@${user.user.username})` : '';
          return `${index + 1}. ${row.name}${username}`;
        } catch (err) {
          console.error(`Failed to fetch username for user_id: ${row.user_id}`, err);
          return `${index + 1}. ${row.name}`;
        }
      })
  );

  const attendeeListText = attendeeList.join('\n');
  const originalDescription = ctx.callbackQuery?.message?.text?.split(`\n\n${MessageText.AttendeeList}`)[0] || '';
  const updatedDescription = `${originalDescription.trim()}\n\n${MessageText.AttendeeList}\n${attendeeListText}`;

  ctx.editMessageText(updatedDescription, {
    reply_markup: ctx.callbackQuery?.message?.reply_markup,
    parse_mode: 'HTML',
  });
};
