import { Bot, Transformer } from 'grammy';
import { network } from './setup';
import { setupBotCommands } from '../src/commands/handlers';
import { AdminService, EventService, PlayerService } from '../src/services';
import { updateAttendeeList } from '../src/utils/updateList';
import { MessageText } from '../src/const';
import { botInfo, event, message, user } from './fixtures';

jest.mock('../src/services', () => ({
  AdminService: { checkAdminStatus: jest.fn() },
  EventService: { getEventByMessageId: jest.fn() },
  PlayerService: { addPlayerToEvent: jest.fn(), removePlayerFromEvent: jest.fn() },
}));
jest.mock('../src/utils/updateList', () => ({ updateAttendeeList: jest.fn() }));

beforeEach(() => {
  jest.mocked(AdminService.checkAdminStatus).mockResolvedValue(true);
  jest.mocked(EventService.getEventByMessageId).mockResolvedValue(event);
  jest.mocked(PlayerService.addPlayerToEvent).mockResolvedValue(true);
  jest.mocked(PlayerService.removePlayerFromEvent).mockResolvedValue(true);
});
let updateId = 0;
async function command(text: string, replyToEvent = true) {
  const bot = new Bot('999:test-only', { botInfo });
  const telegram = jest.fn(async () => ({ ok: true as const, result: true }));
  bot.api.config.use(telegram as Transformer);
  setupBotCommands(bot);
  await bot.handleUpdate({ update_id: ++updateId, message: {
    ...message, from: { ...user, id: 1000 + updateId }, message_id: 11, text,
    entities: [{ type: 'bot_command', offset: 0, length: text.split(' ')[0].length }],
    reply_to_message: replyToEvent ? message : undefined,
  } });
  expect(network).not.toHaveBeenCalled();
  return telegram;
}

it.each(['/addPlayer Test Guest', '/removePlayer Test Guest'])('blocks non-admin %s through the command router', async text => {
  jest.mocked(AdminService.checkAdminStatus).mockResolvedValue(false);
  const telegram = await command(text);
  expect(EventService.getEventByMessageId).not.toHaveBeenCalled();
  expect(PlayerService.addPlayerToEvent).not.toHaveBeenCalled();
  expect(PlayerService.removePlayerFromEvent).not.toHaveBeenCalled();
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'sendMessage',
    expect.objectContaining({ text: MessageText.NoAccess, message_thread_id: 5 }), undefined);
});

it.each([
  ['/addPlayer Test Guest', 'addPlayerToEvent'],
  ['/removePlayer Test Guest', 'removePlayerFromEvent'],
] as const)('validates and routes %s for an admin', async (text, method) => {
  const telegram = await command(text);
  expect(PlayerService[method]).toHaveBeenCalledWith(7, 'Test Guest');
  expect(updateAttendeeList).toHaveBeenCalledWith(expect.anything(), 7, -100123, 10);
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'deleteMessage',
    expect.objectContaining({ chat_id: -100123, message_id: 11 }), undefined);
});

it('requires replying to an event before adding a player', async () => {
  const telegram = await command('/addPlayer Test Guest', false);
  expect(PlayerService.addPlayerToEvent).not.toHaveBeenCalled();
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'sendMessage',
    expect.objectContaining({ text: MessageText.ReplyToEventMessage }), undefined);
});

it('rejects an empty player name', async () => {
  await command('/addPlayer');
  expect(PlayerService.addPlayerToEvent).not.toHaveBeenCalled();
});

it('reports an absent event without changing attendance', async () => {
  jest.mocked(EventService.getEventByMessageId).mockResolvedValue(null);
  const telegram = await command('/addPlayer Test Guest');
  expect(PlayerService.addPlayerToEvent).not.toHaveBeenCalled();
  expect(telegram).toHaveBeenCalledWith(expect.anything(), 'sendMessage',
    expect.objectContaining({ text: MessageText.EventNotFound }), undefined);
});
