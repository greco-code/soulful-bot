import { Context } from 'grammy';
import { logger } from '../utils';
import { MessageText, Limits } from '../const';
import { isIdValid } from '../utils';
import { BotContext } from '../types/context';

export const validateUserId = async (ctx: Context, next: () => Promise<void>) => {
    try {
        const userId = parseInt(ctx.message?.text?.split(' ')[1] || '');

        if (!isIdValid(userId)) {
            logger.warn(`Invalid user ID provided: ${userId}`);
            await ctx.reply(MessageText.InvalidUserId, { message_thread_id: ctx.message?.message_thread_id });
            return;
        }

        (ctx as BotContext).validatedUserId = userId;
        await next();
    } catch (error) {
        logger.error('Error in validateUserId middleware:', error);
        await ctx.reply(MessageText.Error, { message_thread_id: ctx.message?.message_thread_id });
    }
};

export const validateEventMessage = async (ctx: Context, next: () => Promise<void>) => {
    try {
        const messageId = ctx.message?.reply_to_message?.message_id;

        if (!messageId) {
            logger.warn('No message ID found for event operation');
            await ctx.reply(MessageText.ReplyToEventMessage, { message_thread_id: ctx.message?.message_thread_id });
            return;
        }

        (ctx as BotContext).eventMessageId = messageId;
        await next();
    } catch (error) {
        logger.error('Error in validateEventMessage middleware:', error);
        await ctx.reply(MessageText.Error, { message_thread_id: ctx.message?.message_thread_id });
    }
};

export const validatePlayerName = async (ctx: Context, next: () => Promise<void>) => {
    try {
        const nameParts = ctx.message?.text?.split(' ').slice(1);
        const name = nameParts?.join(' ').trim();

        if (!name) {
            logger.warn('No player name provided');
            await ctx.reply(MessageText.InvalidAddCommand, { message_thread_id: ctx.message?.message_thread_id });
            return;
        }

        if (name.length > Limits.MaxPlayerNameLength) {
            logger.warn(`Player name too long: ${name.length} chars`);
            await ctx.reply(MessageText.InputTooLong, { message_thread_id: ctx.message?.message_thread_id });
            return;
        }

        (ctx as BotContext).playerName = name;
        await next();
    } catch (error) {
        logger.error('Error in validatePlayerName middleware:', error);
        await ctx.reply(MessageText.Error, { message_thread_id: ctx.message?.message_thread_id });
    }
};

export const validateNotificationText = async (ctx: Context, next: () => Promise<void>) => {
    try {
        const textParts = ctx.message?.text?.split(' ').slice(1);
        const notificationText = textParts?.join(' ').trim();

        if (!notificationText) {
            logger.warn('No notification text provided');
            await ctx.reply('Пожалуйста, укажите текст для уведомления.', { 
                message_thread_id: ctx.message?.message_thread_id 
            });
            return;
        }

        if (notificationText.length > Limits.MaxDescriptionLength) {
            logger.warn(`Notification text too long: ${notificationText.length} chars`);
            await ctx.reply(MessageText.InputTooLong, { message_thread_id: ctx.message?.message_thread_id });
            return;
        }

        (ctx as BotContext).notificationText = notificationText;
        await next();
    } catch (error) {
        logger.error('Error in validateNotificationText middleware:', error);
        await ctx.reply(MessageText.Error, { message_thread_id: ctx.message?.message_thread_id });
    }
};
