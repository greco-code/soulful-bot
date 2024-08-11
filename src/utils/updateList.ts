import {Context} from 'grammy';
import {openDb} from '../db';
import {MessageText} from '../const';

export const updateAttendeeList = async (
    ctx: Context,
    eventId: number,
    chatId: number | undefined,
    messageId: number | undefined
) => {
  const db = await openDb();

  const attendees = await db.all('SELECT name, user_id FROM attendees WHERE event_id = ?', [eventId]);

  const attendeeList = await Promise.all(
      attendees.map(async (row: { name: string; user_id: number }, index: number) => {
        try {
          if (!chatId) return;

          const user = row.user_id
              ? await ctx.api.getChatMember(chatId, row.user_id).then((u) => (u.user.username ? ` (@${u.user.username})` : ''))
              : '';

          return `${index + 1}. ${row.name}${user}`;
        } catch (err) {
          console.error(`Failed to fetch username for user_id: ${row.user_id}`, err);
          return `${index + 1}. ${row.name}`;
        }
      })
  );

  const attendeeListText = attendeeList.join('\n');
  const originalDescription =
      ctx.callbackQuery?.message?.text?.split(`\n\n${MessageText.AttendeeList}`)[0] ||
      ctx.message?.reply_to_message?.text?.split(`\n\n${MessageText.AttendeeList}`)[0] ||
      '';

  const updatedDescription = `${originalDescription.trim()}\n\n${MessageText.AttendeeList}\n${attendeeListText}`;

  if (chatId && messageId) {
    try {
      await ctx.api.editMessageText(chatId, messageId, updatedDescription, {
        reply_markup: ctx.callbackQuery?.message?.reply_markup || ctx.message?.reply_to_message?.reply_markup, // Preserve the inline keyboard
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error('Error editing message:', error);
    }
  } else {
    console.error(`Failed to edit message: ${messageId}`);
  }
};
