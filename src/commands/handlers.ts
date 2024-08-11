import { Bot, Context } from 'grammy';
import { startCommand } from './start';
import { eventCommand } from './event';
import { handleCallbackQuery } from './callback_query';

export const setupBotCommands = (bot: Bot<Context>) => {
  bot.command('start', startCommand);
  bot.command('event', eventCommand);
  bot.on('callback_query:data', handleCallbackQuery);
};
