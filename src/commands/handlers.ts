import { Bot, Context } from 'grammy';
import { eventCommand } from './event';
import { handleCallbackQuery } from './callback_query';
import {
  addAdminCommand,
  removeAdminCommand,
  addPlayerCommand,
  removePlayerCommand,
  updateDescriptionCommand,
  updateMaxAttendeesCommand
} from './admin';
import { requireAdmin, validateUserId, validateEventMessage, validatePlayerName, rateLimitCommands, rateLimitCallbacks } from '../middleware';
import { Commands, EventTypes, MessageText } from '../const';

// Basic commands
const startCommand = (ctx: Context) => {
  ctx.reply(MessageText.Welcome);
};

export const setupBotCommands = (bot: Bot<Context>) => {
  // Apply rate limiting to all commands globally
  bot.use(rateLimitCommands);

  // Basic commands
  bot.command(Commands.Start, startCommand);
  bot.command(Commands.Event, eventCommand);

  // Admin commands with validation middleware
  bot.command(Commands.AddAdmin, validateUserId, requireAdmin, addAdminCommand);
  bot.command(Commands.RemoveAdmin, validateUserId, requireAdmin, removeAdminCommand);
  bot.command(Commands.AddPlayer, validatePlayerName, validateEventMessage, requireAdmin, addPlayerCommand);
  bot.command(Commands.RemovePlayer, validatePlayerName, validateEventMessage, requireAdmin, removePlayerCommand);
  bot.command(Commands.UpdateDescription, validateEventMessage, requireAdmin, updateDescriptionCommand);
  bot.command(Commands.UpdateMax, validateEventMessage, requireAdmin, updateMaxAttendeesCommand);

  // Callback queries with rate limiting
  bot.on(EventTypes.CallbackQueryData, rateLimitCallbacks, handleCallbackQuery);
};
