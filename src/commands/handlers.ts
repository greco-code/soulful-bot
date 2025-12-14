import { Bot, Context } from 'grammy';
import { eventCommand } from './event';
import { handleCallbackQuery } from './callback_query';
import {
  addAdminCommand,
  removeAdminCommand,
  addPlayerCommand,
  removePlayerCommand,
  updateDescriptionCommand,
  updateMaxAttendeesCommand,
  notifyAllCommand
} from './admin';
import { requireAdmin, validateUserId, validateEventMessage, validatePlayerName, validateNotificationText, rateLimitCommands, rateLimitCallbacks } from '../middleware';
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
  bot.command(Commands.NotifyAll, validateNotificationText, validateEventMessage, requireAdmin, notifyAllCommand);

  // Callback queries with rate limiting
  bot.on(EventTypes.CallbackQueryData, rateLimitCallbacks, handleCallbackQuery);

  // Handle unknown commands (must be last, after all command handlers)
  // Only catch messages that are actual commands (have command entities) but weren't handled by Grammy
  bot.on('message:text', async (ctx, next) => {
    const text = ctx.message?.text;
    const entities = ctx.message?.entities;
    
    // Check if this message has a command entity (bot_command)
    const isCommand = entities?.some(entity => entity.type === 'bot_command');
    
    if (isCommand && text?.startsWith('/')) {
      // Extract command name (everything before space or @), remove leading /
      const commandName = text.split(/[\s@]/)[0].substring(1);
      const registeredCommands = Object.values(Commands);
      
      // Only show unknown command if it's not in our registered commands (case-sensitive check)
      if (!registeredCommands.includes(commandName as Commands)) {
        logger.warn(`Unknown command received: ${text} from user ${ctx.from?.id}`);
        await ctx.reply(MessageText.UnknownCommand, {
          message_thread_id: ctx.message?.message_thread_id
        });
        return;
      }
    }
    
    // If it's not a command or it's a known command, pass to next handler
    await next();
  });
};
