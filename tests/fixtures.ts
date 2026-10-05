import { Api, Context, Transformer } from 'grammy';
import { network } from './setup';
import type { Update, User } from 'grammy/types';
import type { Event } from '../src/models/event';

export const user: User = { id: 123, is_bot: false, first_name: 'Test', last_name: 'Player' };
export const botInfo = {
  id: 999, is_bot: true as const, first_name: 'Test Bot', username: 'test_bot',
  can_join_groups: true, can_read_all_group_messages: false, supports_inline_queries: false,
  can_connect_to_business: false, has_main_web_app: false,
};
export const event: Event = {
  id: 7, description: 'Game night', max_attendees: 12, message_id: 10,
  created_at: '2026-10-01T00:00:00Z',
};
export const message = {
  message_id: 10, date: 0, chat: { id: -100123, type: 'supergroup' as const, title: 'Test club' },
  text: 'Game night', from: user, message_thread_id: 5, reply_to_message: undefined,
  reply_markup: { inline_keyboard: [[{ text: 'Join', callback_data: 'add:7' }]] },
};

export function context(update: Update) {
  const api = new Api('999:test-only');
  const telegram = jest.fn(async () => ({ ok: true as const, result: true }));
  // These tests inspect outgoing payloads; successful results are not consumed.
  api.config.use(telegram as Transformer);
  return { ctx: new Context(update, api, botInfo), telegram, network };
}

export function callback(data: string) {
  return context({ update_id: 1, callback_query: { id: 'callback-1', from: user,
    chat_instance: 'test', data, message } });
}
