import { Context } from 'grammy';

// Extended context with validated data from middleware
export interface BotContext extends Context {
    validatedUserId?: number;
    eventMessageId?: number;
    playerName?: string;
}


