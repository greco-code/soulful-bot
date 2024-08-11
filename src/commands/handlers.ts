import {Bot, Context} from 'grammy';
import {startCommand} from './start';
import {eventCommand} from './event';
import {handleCallbackQuery} from './callback_query';
import {addAdminCommand, addPlayer, removeAdminCommand, removePlayer} from "./admins";

export const setupBotCommands = (bot: Bot<Context>) => {
  bot.command('start', startCommand);
  bot.command('event', eventCommand);
  bot.command('addAdmin', addAdminCommand);
  bot.command('removeAdmin', removeAdminCommand);
  bot.command('addPlayer', addPlayer);
  bot.command('removePlayer', removePlayer);
  bot.on('callback_query:data', handleCallbackQuery);
};
