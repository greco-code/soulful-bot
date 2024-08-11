import {Context} from 'grammy';
import {getDbClient} from '../db';
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
  const dbClient = await getDbClient();

  try {
    const existingAttendee = await dbClient.query(
        'SELECT * FROM attendees WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
    );

    const eventResult = await dbClient.query('SELECT * FROM events WHERE id = $1', [eventId]);
    const event = eventResult.rows[0];

    if (!event) {
      ctx.answerCallbackQuery({text: MessageText.EventNotFound});
      return;
    }

    const attendeeCountResult = await dbClient.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM attendees WHERE event_id = $1',
        [eventId]
    );
    const attendeeCount = attendeeCountResult.rows[0];

    if (!attendeeCount) {
      return;
    }

    if (action === Action.Register) {
      if (existingAttendee.rows.length > 0) {
        ctx.answerCallbackQuery({text: MessageText.AlreadyRegistered});
        return;
      }

      if (attendeeCount.count >= event.max_attendees) {
        ctx.answerCallbackQuery({text: MessageText.EventFull});
        return;
      }

      await dbClient.query(
          'INSERT INTO attendees (event_id, user_id, name) VALUES ($1, $2, $3)',
          [eventId, userId, `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim()]
      );

      ctx.answerCallbackQuery({text: MessageText.RSVPConfirmed});
    } else if (action === Action.Unregister) {
      if (existingAttendee.rows.length === 0) {
        ctx.answerCallbackQuery({text: MessageText.NotRegistered});
        return;
      }

      await dbClient.query('DELETE FROM attendees WHERE event_id = $1 AND user_id = $2', [
        eventId,
        userId,
      ]);

      ctx.answerCallbackQuery({text: MessageText.RSVCanceled});
    }

    await updateAttendeeList(ctx, parseInt(eventId), ctx.chatId, ctx.callbackQuery?.message?.message_id);
  } catch (error) {
    console.error('Error handling callback query:', error);
    ctx.answerCallbackQuery({text: MessageText.Error});
  } finally {
    dbClient.release();
  }
};
