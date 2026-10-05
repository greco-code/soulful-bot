import { handleCallbackQuery } from '../src/commands/callback_query';
import { EventService, PlayerService } from '../src/services';
import { updateAttendeeList } from '../src/utils/updateList';
import { MessageText } from '../src/const';
import { callback, event } from './fixtures';

jest.mock('../src/services', () => ({
  EventService: { getEventById: jest.fn() },
  PlayerService: {
    checkPlayerRegistration: jest.fn(), canRegisterForEvent: jest.fn(),
    addFullPlayerToEvent: jest.fn(), removePlayerFromEventById: jest.fn(),
    addGuestToEvent: jest.fn(), removeGuestFromEvent: jest.fn(),
  },
}));
jest.mock('../src/utils/updateList', () => ({ updateAttendeeList: jest.fn() }));
const players = jest.mocked(PlayerService);

beforeEach(() => {
  jest.mocked(EventService.getEventById).mockResolvedValue(event);
  players.checkPlayerRegistration.mockResolvedValue(false);
  players.canRegisterForEvent.mockResolvedValue(true);
  players.addFullPlayerToEvent.mockResolvedValue(true);
  players.removePlayerFromEventById.mockResolvedValue(true);
  players.addGuestToEvent.mockResolvedValue(true);
  players.removeGuestFromEvent.mockResolvedValue(true);
});

it('registers the Telegram user, confirms and refreshes the event post', async () => {
  const { ctx, telegram, network } = callback('add:7');
  await handleCallbackQuery(ctx);
  expect(players.addFullPlayerToEvent).toHaveBeenCalledWith('7', 123, 'Test Player');
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'answerCallbackQuery',
    expect.objectContaining({ text: MessageText.RSVPConfirmed }), undefined);
  expect(updateAttendeeList).toHaveBeenCalledWith(ctx, 7, -100123, 10);
  expect(network).not.toHaveBeenCalled();
});

it.each([
  [true, true, MessageText.AlreadyRegistered],
  [false, false, MessageText.EventFull],
])('rejects registration when registered=%s and capacity=%s', async (registered, capacity, text) => {
  players.checkPlayerRegistration.mockResolvedValue(registered);
  players.canRegisterForEvent.mockResolvedValue(capacity);
  const { ctx, telegram } = callback('add:7');
  await handleCallbackQuery(ctx);
  expect(players.addFullPlayerToEvent).not.toHaveBeenCalled();
  expect(updateAttendeeList).not.toHaveBeenCalled();
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'answerCallbackQuery',
    expect.objectContaining({ text }), undefined);
});

it.each([
  ['remove:7', 'removePlayerFromEventById', MessageText.RSVCanceled],
  ['addGuest:7', 'addGuestToEvent', MessageText.GuestAdded],
  ['removeGuest:7', 'removeGuestFromEvent', MessageText.GuestRemoved],
] as const)('handles %s for a registered player', async (data, method, text) => {
  players.checkPlayerRegistration.mockResolvedValue(true);
  const { ctx, telegram } = callback(data);
  await handleCallbackQuery(ctx);
  expect(players[method]).toHaveBeenCalled();
  expect(updateAttendeeList).toHaveBeenCalledWith(ctx, 7, -100123, 10);
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'answerCallbackQuery',
    expect.objectContaining({ text }), undefined);
});

it.each(['remove:7', 'addGuest:7', 'removeGuest:7'])('requires registration for %s', async data => {
  const { ctx } = callback(data);
  await handleCallbackQuery(ctx);
  expect(players.removePlayerFromEventById).not.toHaveBeenCalled();
  expect(players.addGuestToEvent).not.toHaveBeenCalled();
  expect(players.removeGuestFromEvent).not.toHaveBeenCalled();
  expect(updateAttendeeList).not.toHaveBeenCalled();
});

it('does not add a guest to a full event', async () => {
  players.checkPlayerRegistration.mockResolvedValue(true);
  players.canRegisterForEvent.mockResolvedValue(false);
  await handleCallbackQuery(callback('addGuest:7').ctx);
  expect(players.addGuestToEvent).not.toHaveBeenCalled();
});

it('reports when there is no guest to remove', async () => {
  players.checkPlayerRegistration.mockResolvedValue(true);
  players.removeGuestFromEvent.mockResolvedValue(false);
  const { ctx, telegram } = callback('removeGuest:7');
  await handleCallbackQuery(ctx);
  expect(updateAttendeeList).not.toHaveBeenCalled();
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'answerCallbackQuery',
    expect.objectContaining({ text: MessageText.NoGuestToRemove }), undefined);
});

it('does not confirm a failed registration', async () => {
  players.addFullPlayerToEvent.mockResolvedValue(false);
  const { ctx, telegram } = callback('add:7');
  await handleCallbackQuery(ctx);
  expect(updateAttendeeList).not.toHaveBeenCalled();
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'answerCallbackQuery',
    expect.objectContaining({ text: MessageText.Error }), undefined);
});

it('removes obsolete buttons when the event no longer exists', async () => {
  jest.mocked(EventService.getEventById).mockResolvedValue(null);
  const { ctx, telegram } = callback('add:7');
  await handleCallbackQuery(ctx);
  expect(players.checkPlayerRegistration).not.toHaveBeenCalled();
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'editMessageReplyMarkup',
    expect.objectContaining({ chat_id: -100123, message_id: 10, reply_markup: undefined }), undefined);
});

it('rejects missing callback data before reading an event', async () => {
  await handleCallbackQuery(callback('').ctx);
  expect(EventService.getEventById).not.toHaveBeenCalled();
});
