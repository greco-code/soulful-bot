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
import { AdminService } from '../services';
import { logger } from '../utils';

// Basic commands
const startCommand = (ctx: Context) => {
  ctx.reply(MessageText.Welcome, {
    message_thread_id: ctx.message?.message_thread_id
  });
};

const helpCommand = async (ctx: Context) => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(MessageText.Help, { parse_mode: 'HTML', message_thread_id: ctx.message?.message_thread_id });
    return;
  }

  const isAdmin = await AdminService.checkAdminStatus(userId);
  const helpText = isAdmin ? MessageText.HelpAdmin : MessageText.Help;
  await ctx.reply(helpText, { parse_mode: 'HTML', message_thread_id: ctx.message?.message_thread_id });
};

export const setupBotCommands = (bot: Bot<Context>) => {
  // Apply rate limiting to all commands globally
  bot.use(rateLimitCommands);

  // Basic commands
  bot.command(Commands.Start, startCommand);
  bot.command(Commands.Help, helpCommand);
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

  // Handle unknown commands (must be last, after all command handlers)
  bot.on('message:text', async (ctx, next) => {
    const text = ctx.message?.text;
    // Check if it's a command (starts with /) but wasn't handled by any command handler
    if (text?.startsWith('/')) {
      logger.warn(`Unknown command received: ${text} from user ${ctx.from?.id}`);
      await ctx.reply(MessageText.UnknownCommand, {
        message_thread_id: ctx.message?.message_thread_id
      });
      return;
    }
    // If it's not a command, pass to next handler (if any)
    await next();
  });
};
