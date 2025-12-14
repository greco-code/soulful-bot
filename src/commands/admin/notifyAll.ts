import { logger } from '../../utils';
import { EventService } from '../../services';
import { MessageText } from '../../const';
import { BotContext } from '../../types';
import { getEventAttendeesWithUserId } from '../../db';

export const notifyAllCommand = async (ctx: BotContext) => {
    logger.info('Received notifyAll command');

    const messageText = ctx.notificationText!;
    const messageId = ctx.eventMessageId!;

    const event = await EventService.getEventByMessageId(messageId);
    if (!event) {
        await ctx.reply(MessageText.EventNotFound, {
            message_thread_id: ctx.message?.message_thread_id
        });
        
        // Delete command message
        if (ctx.message?.message_id && ctx.chat?.id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            logger.info(`Deleted notifyAll command message from user ${ctx.from?.id}`);
        }
        return;
    }

    // Get all attendees with user_id
    const attendeesResult = await getEventAttendeesWithUserId(event.id);
    if (!attendeesResult || !attendeesResult.rows || attendeesResult.rows.length === 0) {
        await ctx.reply('Нет зарегистрированных участников с аккаунтами Telegram для этого события.', {
            message_thread_id: ctx.message?.message_thread_id
        });
        
        // Delete command message
        if (ctx.message?.message_id && ctx.chat?.id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            logger.info(`Deleted notifyAll command message from user ${ctx.from?.id}`);
        }
        return;
    }

    const chatId = ctx.chat?.id;
    if (!chatId) {
        await ctx.reply(MessageText.Error, {
            message_thread_id: ctx.message?.message_thread_id
        });
        
        // Delete command message
        if (ctx.message?.message_id && ctx.chat?.id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            logger.info(`Deleted notifyAll command message from user ${ctx.from?.id}`);
        }
        return;
    }

    try {
        // Build message text with mentions
        let notificationText = messageText + '\n\n';
        const entities: Array<{
            type: 'text_mention';
            offset: number;
            length: number;
            user: {
                id: number;
                is_bot: boolean;
                first_name: string;
                last_name?: string;
                username?: string;
                language_code?: string;
            };
        }> = [];
        let currentOffset = notificationText.length;

        // Get user info and create mentions
        for (const attendee of attendeesResult.rows) {
            const userId = attendee.user_id;
            if (!userId) continue;

            try {
                const chatMember = await ctx.api.getChatMember(chatId, userId);
                const user = chatMember.user;
                const userName = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
                
                // Add mention to text
                notificationText += `${userName} `;
                
                // Create text_mention entity
                entities.push({
                    type: 'text_mention',
                    offset: currentOffset,
                    length: userName.length,
                    user: {
                        id: user.id,
                        is_bot: user.is_bot || false,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        username: user.username,
                        language_code: user.language_code
                    }
                });

                currentOffset += userName.length + 1; // +1 for space
            } catch (err) {
                logger.error(`Failed to get chat member for user ${userId}:`, err);
                // Skip this user if we can't get their info
            }
        }

        // Send message with mentions
        await ctx.api.sendMessage(chatId, notificationText.trim(), {
            message_thread_id: ctx.message?.message_thread_id,
            entities: entities
        });

        logger.info(`Sent notification to ${entities.length} users for event ID: ${event.id}`);

        // Delete command message
        if (ctx.message?.message_id && ctx.chat?.id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            logger.info(`Deleted notifyAll command message from user ${ctx.from?.id}`);
        }
    } catch (error) {
        logger.error('Error sending notification:', error);
        await ctx.reply(MessageText.Error, {
            message_thread_id: ctx.message?.message_thread_id
        });

        // Delete command message
        if (ctx.message?.message_id && ctx.chat?.id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            logger.info(`Deleted notifyAll command message from user ${ctx.from?.id}`);
        }
    }
};
