import { updateAttendeeList } from '../src/utils/updateList';
import { database } from './setup';
import { callback, message, user } from './fixtures';

beforeEach(() => database.query.mockReset());

it('renders names, usernames, guests and total while preserving the description and buttons', async () => {
  database.query.mockResolvedValueOnce({ rows: [
    { name: 'Test Player', user_id: 123, guest_of_user_id: null },
    { name: "Test Player's +1", user_id: null, guest_of_user_id: 123 },
    { name: 'Manual Player', user_id: null, guest_of_user_id: null },
  ] });
  const { ctx, telegram, network } = callback('add:7');
  // Override only this lookup, keeping all API calls inside the test.
  jest.spyOn(ctx.api, 'getChatMember').mockResolvedValue({ status: 'member', user: { ...user, username: 'test_player' } });
  await updateAttendeeList(ctx, 7, -100123, 10);
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'editMessageText', {
    chat_id: -100123, message_id: 10,
    text: "Game night\n\nПредварительный состав:\n1. Test Player (@test_player)\n   └─ Test Player's +1\n2. Manual Player\n\n<b>Всего участников: 3</b>",
    reply_markup: message.reply_markup, parse_mode: 'HTML',
  }, undefined);
  expect(database.release).toHaveBeenCalledTimes(1);
  expect(network).not.toHaveBeenCalled();
});

it('replaces the old roster rather than appending another copy', async () => {
  database.query.mockResolvedValueOnce({ rows: [] });
  const { ctx, telegram } = callback('remove:7');
  if (!ctx.callbackQuery?.message) throw new Error('Missing test message');
  ctx.callbackQuery.message = { ...message, text: 'Game night\n\nПредварительный состав:\n1. Old Player' };
  await updateAttendeeList(ctx, 7, -100123, 10);
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'editMessageText',
    expect.objectContaining({ text: 'Game night\n\nПредварительный состав:\n\n\n<b>Всего участников: 0</b>' }), undefined);
});

it('keeps the saved player name when username lookup fails', async () => {
  database.query.mockResolvedValueOnce({ rows: [{ name: 'Test Player', user_id: 123, guest_of_user_id: null }] });
  const { ctx, telegram } = callback('add:7');
  jest.spyOn(ctx.api, 'getChatMember').mockRejectedValue(new Error('Member unavailable'));
  await updateAttendeeList(ctx, 7, -100123, 10);
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'editMessageText',
    expect.objectContaining({ text: expect.stringContaining('1. Test Player\n') }), undefined);
  expect(database.release).toHaveBeenCalledTimes(1);
});

it('releases the connection and does not edit the post when the roster query fails', async () => {
  database.query.mockRejectedValueOnce(new Error('Database unavailable'));
  const { ctx, telegram } = callback('add:7');
  await updateAttendeeList(ctx, 7, -100123, 10);
  expect(database.release).toHaveBeenCalledTimes(1);
  expect(telegram).not.toHaveBeenCalled();
});
