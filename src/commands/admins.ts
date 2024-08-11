import {Context} from 'grammy';
import {addAdmin, isAdmin, getDbClient, removeAdmin} from '../db';
import {MessageText} from '../const';
import {isIdValid, updateAttendeeList} from '../utils';

export const addAdminCommand = async (ctx: Context) => {
  const isUserAdmin = await isAdmin(ctx.from?.id || 0);
  if (!isUserAdmin) {
    return ctx.reply(MessageText.NoAccess);
  }

  const userId = parseInt(ctx.message?.text?.split(' ')[1] || '');

  if (!isIdValid(userId)) {
    return ctx.reply(MessageText.InvalidUserId);
  }

  const isNewUserAdmin = await isAdmin(userId);

  if (isNewUserAdmin) {
    return ctx.reply(MessageText.AdminAlreadyAdded);
  }

  await addAdmin(userId);
  ctx.reply(MessageText.AdminAdded);
};

export const removeAdminCommand = async (ctx: Context) => {
  const isUserAdmin = await isAdmin(ctx.from?.id || 0);
  if (!isUserAdmin) {
    return ctx.reply(MessageText.NoAccess);
  }

  const userId = parseInt(ctx.message?.text?.split(' ')[1] || '');

  if (!isIdValid(userId)) {
    return ctx.reply(MessageText.InvalidUserId);
  }

  const isAdminAlready = await isAdmin(userId);

  if (!isAdminAlready) {
    return ctx.reply(MessageText.AdminNotExist);
  }

  const db = await getDbClient();
  const adminCountResult = await db.query('SELECT COUNT(*) as count FROM admins');
  const adminCount = parseInt(adminCountResult.rows[0].count, 10);

  if (adminCount <= 1) {
    await ctx.reply(MessageText.LastAdmin);
    return;
  }

  await removeAdmin(userId);
  ctx.reply(MessageText.AdminRemoved);
};

export const addPlayer = async (ctx: Context) => {
  const nameParts = ctx.message?.text?.split(' ').slice(1);
  const name = nameParts?.join(' ');

  if (!name) {
    await ctx.reply(MessageText.InvalidAddCommand);
    return;
  }

  const messageId = ctx.message?.reply_to_message?.message_id;

  if (!messageId) {
    await ctx.reply(MessageText.ReplyToEventMessage);
    return;
  }

  const db = await getDbClient();
  const eventResult = await db.query('SELECT * FROM events WHERE message_id = $1', [messageId]);

  if (eventResult.rows.length === 0) {
    await ctx.reply(MessageText.EventNotFound);
    return;
  }

  const event = eventResult.rows[0];

  const existingAttendeeResult = await db.query('SELECT * FROM attendees WHERE event_id = $1 AND name = $2', [
    event.id,
    name,
  ]);

  if (existingAttendeeResult.rows.length > 0) {
    await ctx.reply(MessageText.PlayerAlreadyInList);
    return;
  }

  await db.query('INSERT INTO attendees (event_id, user_id, name) VALUES ($1, NULL, $2)', [
    event.id,
    name,
  ]);

  await updateAttendeeList(ctx, event.id, ctx.chat?.id, messageId);
};

export const removePlayer = async (ctx: Context) => {
  const nameParts = ctx.message?.text?.split(' ').slice(1);
  const name = nameParts?.join(' ');

  if (!name) {
    await ctx.reply(MessageText.InvalidRemoveCommand);
    return;
  }

  const messageId = ctx.message?.reply_to_message?.message_id;

  if (!messageId) {
    await ctx.reply(MessageText.ReplyToEventMessage);
    return;
  }

  const db = await getDbClient();
  const eventResult = await db.query('SELECT * FROM events WHERE message_id = $1', [messageId]);

  if (eventResult.rows.length === 0) {
    await ctx.reply(MessageText.EventNotFound);
    return;
  }

  const event = eventResult.rows[0];

  const existingAttendeeResult = await db.query('SELECT * FROM attendees WHERE event_id = $1 AND name = $2', [
    event.id,
    name,
  ]);

  if (existingAttendeeResult.rows.length === 0) {
    await ctx.reply(MessageText.PlayerNotInList);
    return;
  }

  await db.query('DELETE FROM attendees WHERE event_id = $1 AND name = $2', [
    event.id,
    name,
  ]);

  await updateAttendeeList(ctx, event.id, ctx.chat?.id, messageId);
};
