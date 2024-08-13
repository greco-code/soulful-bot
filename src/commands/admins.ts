import {Context} from 'grammy';
import {logger} from '../utils';
import {addAdmin, isAdmin, getDbClient, removeAdmin} from '../db';
import {MessageText} from '../const';
import {isIdValid, updateAttendeeList} from '../utils';

export const addAdminCommand = async (ctx: Context) => {
  logger.info('Received addAdminCommand');
  const isUserAdmin = await isAdmin(ctx.from?.id || 0);
  if (!isUserAdmin) {
    logger.warn(`User ${ctx.from?.id} attempted to add admin without sufficient rights.`);
    return ctx.reply(MessageText.NoAccess);
  }

  const userId = parseInt(ctx.message?.text?.split(' ')[1] || '');

  if (!isIdValid(userId)) {
    logger.warn(`Invalid user ID provided: ${userId}`);
    return ctx.reply(MessageText.InvalidUserId);
  }

  const isNewUserAdmin = await isAdmin(userId);

  if (isNewUserAdmin) {
    logger.info(`User ID ${userId} is already an admin.`);
    return ctx.reply(MessageText.AdminAlreadyAdded);
  }

  await addAdmin(userId);
  logger.info(`User ID ${userId} was successfully added as an admin.`);
  ctx.reply(MessageText.AdminAdded);
};

export const removeAdminCommand = async (ctx: Context) => {
  logger.info('Received removeAdminCommand');
  const isUserAdmin = await isAdmin(ctx.from?.id || 0);
  if (!isUserAdmin) {
    logger.warn(`User ${ctx.from?.id} attempted to remove admin without sufficient rights.`);
    return ctx.reply(MessageText.NoAccess);
  }

  const userId = parseInt(ctx.message?.text?.split(' ')[1] || '');

  if (!isIdValid(userId)) {
    logger.warn(`Invalid user ID provided: ${userId}`);
    return ctx.reply(MessageText.InvalidUserId);
  }

  const isAdminAlready = await isAdmin(userId);

  if (!isAdminAlready) {
    logger.info(`User ID ${userId} is not an admin.`);
    return ctx.reply(MessageText.AdminNotExist);
  }

  const db = await getDbClient();
  const adminCountResult = await db.query('SELECT COUNT(*) as count FROM admins');
  const adminCount = parseInt(adminCountResult.rows[0].count, 10);

  if (adminCount <= 1) {
    logger.warn('Attempt to remove the last admin was blocked.');
    await ctx.reply(MessageText.LastAdmin);
    return;
  }

  await removeAdmin(userId);
  logger.info(`User ID ${userId} was successfully removed as an admin.`);
  ctx.reply(MessageText.AdminRemoved);
};

export const addPlayer = async (ctx: Context) => {
  logger.info('Received addPlayer command');
  const nameParts = ctx.message?.text?.split(' ').slice(1);
  const name = nameParts?.join(' ');

  if (!name) {
    logger.warn('No name provided in addPlayer command');
    await ctx.reply(MessageText.InvalidAddCommand);
    return;
  }

  const messageId = ctx.message?.reply_to_message?.message_id;

  if (!messageId) {
    logger.warn('No message ID found to add player');
    await ctx.reply(MessageText.ReplyToEventMessage);
    return;
  }

  const db = await getDbClient();
  const eventResult = await db.query('SELECT * FROM events WHERE message_id = $1', [messageId]);

  if (eventResult.rows.length === 0) {
    logger.warn('No event found for the given message ID');
    await ctx.reply(MessageText.EventNotFound);
    return;
  }

  const event = eventResult.rows[0];

  const existingAttendeeResult = await db.query('SELECT * FROM attendees WHERE event_id = $1 AND name = $2', [
    event.id,
    name,
  ]);

  if (existingAttendeeResult.rows.length > 0) {
    logger.info(`Player ${name} is already in the list for event ID ${event.id}`);
    await ctx.reply(MessageText.PlayerAlreadyInList);
    return;
  }

  await db.query('INSERT INTO attendees (event_id, user_id, name) VALUES ($1, NULL, $2)', [
    event.id,
    name,
  ]);
  logger.info(`Player ${name} added to event ID ${event.id}`);

  await updateAttendeeList(ctx, event.id, ctx.chat?.id, messageId);
};

export const removePlayer = async (ctx: Context) => {
  logger.info('Received removePlayer command');
  const nameParts = ctx.message?.text?.split(' ').slice(1);
  const name = nameParts?.join(' ');

  if (!name) {
    logger.warn('No name provided in removePlayer command');
    await ctx.reply(MessageText.InvalidRemoveCommand);
    return;
  }

  const messageId = ctx.message?.reply_to_message?.message_id;

  if (!messageId) {
    logger.warn('No message ID found to remove player');
    await ctx.reply(MessageText.ReplyToEventMessage);
    return;
  }

  const db = await getDbClient();
  const eventResult = await db.query('SELECT * FROM events WHERE message_id = $1', [messageId]);

  if (eventResult.rows.length === 0) {
    logger.warn('No event found for the given message ID');
    await ctx.reply(MessageText.EventNotFound);
    return;
  }

  const event = eventResult.rows[0];

  const existingAttendeeResult = await db.query('SELECT * FROM attendees WHERE event_id = $1 AND name = $2', [
    event.id,
    name,
  ]);

  if (existingAttendeeResult.rows.length === 0) {
    logger.info(`Player ${name} is not in the list for event ID ${event.id}`);
    await ctx.reply(MessageText.PlayerNotInList);
    return;
  }

  await db.query('DELETE FROM attendees WHERE event_id = $1 AND name = $2', [
    event.id,
    name,
  ]);
  logger.info(`Player ${name} removed from event ID ${event.id}`);

  await updateAttendeeList(ctx, event.id, ctx.chat?.id, messageId);
};
