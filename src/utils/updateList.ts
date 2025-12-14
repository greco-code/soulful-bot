import { Context } from 'grammy';
import { getDbClient } from '../db';
import { MessageText } from '../const';
import { logger } from './logger';

export const updateAttendeeList = async (
  ctx: Context,
  eventId: number,
  chatId: number | undefined,
  messageId: number | undefined
) => {
  const db = await getDbClient();

  try {
    // Get all attendees including guests
    // Order: group guests with their user (COALESCE), then user before guests (NULLS FIRST), then by id
    const attendeesResult = await db.query(
      'SELECT name, user_id, guest_of_user_id FROM attendees WHERE event_id = $1 ORDER BY COALESCE(guest_of_user_id, user_id), CASE WHEN guest_of_user_id IS NULL THEN 0 ELSE 1 END, id',
      [eventId]
    );
    const attendees = attendeesResult.rows;

    let attendeeIndex = 0;
    const attendeeList = await Promise.all(
      attendees.map(async (row: { name: string; user_id: number | null; guest_of_user_id: number | null }) => {
        try {
          if (!chatId) return;

          // If it's a guest, display it indented under the user
          if (row.guest_of_user_id) {
            return `   └─ ${row.name}`;
          }

          // Regular attendee
          attendeeIndex++;
          const user = row.user_id
            ? await ctx.api.getChatMember(chatId, row.user_id).then((u) => (u.user.username ? ` (@${u.user.username})` : ''))
            : '';

          return `${attendeeIndex}. ${row.name}${user}`;
        } catch (err) {
          logger.error(`Failed to fetch username for user_id: ${row.user_id}`, err);
          if (row.guest_of_user_id) {
            return `   └─ ${row.name}`;
          }
          attendeeIndex++;
          return `${attendeeIndex}. ${row.name}`;
        }
      })
    );

    const attendeeListText = attendeeList.filter(Boolean).join('\n');
    const totalCount = attendees.length;
    const finalListText = `${attendeeListText}\n\n<b>Всего участников: ${totalCount}</b>`;
    const originalDescription =
      ctx.callbackQuery?.message?.text?.split(`\n\n${MessageText.AttendeeList}`)[0] ||
      ctx.message?.reply_to_message?.text?.split(`\n\n${MessageText.AttendeeList}`)[0] ||
      '';

    const updatedDescription = `${originalDescription.trim()}\n\n${MessageText.AttendeeList}\n${finalListText}`;

    if (chatId && messageId) {
      try {
        const messageThreadId = ctx.message?.message_thread_id;

        await ctx.api.editMessageText(chatId, messageId, updatedDescription, {
          reply_markup: ctx.callbackQuery?.message?.reply_markup || ctx.message?.reply_to_message?.reply_markup, // Preserve the inline keyboard
          parse_mode: 'HTML',
        });
      } catch (error) {
        logger.error('Error editing message:', error);
      }
    } else {
      logger.error(`Failed to edit message: ${messageId}`);
    }
  } catch (error) {
    logger.error('Error fetching attendees:', error);
  } finally {
    db.release();
  }
};
