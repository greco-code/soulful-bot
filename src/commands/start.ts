import { Context } from 'grammy';
import { MessageText } from '../const';

export const startCommand = (ctx: Context) => {
  ctx.reply(MessageText.Welcome);
};
