import { Context } from 'grammy';
import { logger } from '../utils';
import { MessageText } from '../const';

// Simple delay tracking: userId -> last action timestamp
const lastActionTime = new Map<number, number>();

// Configuration: minimum delay between actions (in milliseconds)
const DELAY_MS = {
  COMMAND: 2000,  // 2 seconds between commands
  CALLBACK: 2000, // 1 second between button clicks
} as const;

const checkDelay = (userId: number, type: 'COMMAND' | 'CALLBACK'): { allowed: boolean; remaining?: number } => {
  const now = Date.now();
  const lastTime = lastActionTime.get(userId);
  const delay = DELAY_MS[type];
  
  if (lastTime && (now - lastTime) < delay) {
    const remaining = Math.ceil((delay - (now - lastTime)) / 1000);
    return { allowed: false, remaining };
  }
  
  lastActionTime.set(userId, now);
  return { allowed: true };
};

export const rateLimitCommands = async (ctx: Context, next: () => Promise<void>) => {
  try {
    // Only apply to message updates (commands)
    if (!ctx.message) {
      await next();
      return;
    }
    
    const userId = ctx.from?.id;
    
    if (!userId) {
      await next();
      return;
    }
    
    const { allowed, remaining } = checkDelay(userId, 'COMMAND');
    
    if (!allowed) {
      logger.warn(`Rate limit exceeded for user ${userId} (commands)`);
      await ctx.reply(
        `⏱ Слишком много запросов. Подождите ${remaining} секунды.`,
        { message_thread_id: ctx.message?.message_thread_id }
      );
      return;
    }
    
    await next();
  } catch (error) {
    logger.error('Error in rateLimitCommands middleware:', error);
    // Don't block on error, allow request through
    await next();
  }
};

export const rateLimitCallbacks = async (ctx: Context, next: () => Promise<void>) => {
  try {
    // Only apply to callback query updates
    if (!ctx.callbackQuery) {
      await next();
      return;
    }
    
    const userId = ctx.from?.id;
    
    if (!userId) {
      await ctx.answerCallbackQuery({ text: MessageText.Error });
      return;
    }
    
    const { allowed, remaining } = checkDelay(userId, 'CALLBACK');
    
    if (!allowed) {
      logger.warn(`Rate limit exceeded for user ${userId} (callbacks)`);
      await ctx.answerCallbackQuery({
        text: `⏱ Слишком много запросов. Подождите ${remaining} секунд.`,
        show_alert: true
      });
      return;
    }
    
    await next();
  } catch (error) {
    logger.error('Error in rateLimitCallbacks middleware:', error);
    // Don't block on error, allow request through
    await next();
  }
};
