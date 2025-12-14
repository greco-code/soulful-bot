import { Context } from 'grammy';
import { logger } from '../utils';
import { MessageText } from '../const';

// Simple delay tracking: userId -> last action timestamp
const lastActionTime = new Map<number, number>();

// Configuration: minimum delay between actions (in milliseconds)
const DELAY_MS = {
  COMMAND: 1000,  // 1 seconds between commands
  CALLBACK: 2000, // 2 second between button clicks
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
  
  try {
    const { allowed, remaining } = checkDelay(userId, 'COMMAND');
    
    if (!allowed) {
      logger.warn(`Rate limit exceeded for user ${userId} (commands)`);
      try {
        await ctx.reply(
          `⏱ Слишком много запросов. Подождите ${remaining} секунду.`,
          { message_thread_id: ctx.message?.message_thread_id }
        );
      } catch (replyError) {
        logger.error('Error sending rate limit reply:', replyError);
      }
      return;
    }
    
    await next();
  } catch (error) {
    logger.error('Error in rateLimitCommands middleware:', error);
    // If error occurred, don't call next() again - it may have already been called
  }
};

export const rateLimitCallbacks = async (ctx: Context, next: () => Promise<void>) => {
  // Only apply to callback query updates
  if (!ctx.callbackQuery) {
    await next();
    return;
  }
  
  const userId = ctx.from?.id;
  
  if (!userId) {
    try {
      await ctx.answerCallbackQuery({ text: MessageText.Error });
    } catch (error) {
      logger.error('Error answering callback query:', error);
    }
    return;
  }
  
  try {
    const { allowed, remaining } = checkDelay(userId, 'CALLBACK');
    
    if (!allowed) {
      logger.warn(`Rate limit exceeded for user ${userId} (callbacks)`);
      try {
        await ctx.answerCallbackQuery({
          text: `⏱ Слишком много запросов. Подождите ${remaining} секунды.`,
          show_alert: true
        });
      } catch (replyError) {
        logger.error('Error sending rate limit callback reply:', replyError);
      }
      return;
    }
    
    await next();
  } catch (error) {
    logger.error('Error in rateLimitCallbacks middleware:', error);
    // If error occurred, don't call next() again - it may have already been called
  }
};
