import {Context} from 'grammy';
import {openDb} from '../db';
import {Action, MessageText} from '../const';
import {updateAttendeeList} from "../utils";

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

  await updateAttendeeList(ctx, parseInt(eventId), ctx.chatId, ctx.callbackQuery?.message?.message_id);
};
