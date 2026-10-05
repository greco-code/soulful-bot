import { eventCommand } from '../src/commands/event';
import { EventService } from '../src/services';
import { MessageText } from '../src/const';
import { context, event, message } from './fixtures';

jest.mock('../src/services', () => ({ EventService: { createEvent: jest.fn() } }));

it('publishes in the current topic and binds the buttons to the saved event ID', async () => {
  jest.mocked(EventService.createEvent).mockResolvedValue(event);
  const { ctx, telegram } = context({ update_id: 1,
    message: { ...message, message_id: 11, text: '/event "Game night" 12' } });
  const reply = jest.spyOn(ctx, 'reply').mockResolvedValue(message);
  await eventCommand(ctx);
  expect(reply).toHaveBeenCalledWith('Game night', expect.objectContaining({ message_thread_id: 5 }));
  expect(EventService.createEvent).toHaveBeenCalledWith('Game night', 12, 10);
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'editMessageReplyMarkup',
    expect.objectContaining({ chat_id: -100123, message_id: 10, reply_markup: {
      inline_keyboard: [
        [{ text: '👍 Записаться', callback_data: 'add:7' }, { text: '🚫 Отменить запись', callback_data: 'remove:7' }],
        [{ text: '➕ +1', callback_data: 'addGuest:7' }, { text: '➖ -1', callback_data: 'removeGuest:7' }],
      ],
    } }), undefined);
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'deleteMessage',
    expect.objectContaining({ chat_id: -100123, message_id: 11 }), undefined);
});

it.each([
  ['/event', MessageText.ProvideEventInfo],
  ['/event Game night twelve', MessageText.InvalidNumber],
])('rejects invalid creation input: %s', async (text, response) => {
  const { ctx, telegram } = context({ update_id: 1, message: { ...message, text } });
  await eventCommand(ctx);
  expect(EventService.createEvent).not.toHaveBeenCalled();
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'sendMessage',
    expect.objectContaining({ text: response, message_thread_id: 5 }), undefined);
});
