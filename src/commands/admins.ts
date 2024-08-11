import { Context } from 'grammy';
import { addAdmin, isAdmin, openDb, removeAdmin } from '../db';
import { MessageText } from '../const';
import { isIdValid, updateAttendeeList } from '../utils';

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

  const db = await openDb();
  const adminCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM admins');

  if (adminCount?.count) {
    if (adminCount.count <= 1) {
      await ctx.reply(MessageText.LastAdmin);
      return;
    }

    await removeAdmin(userId);
    ctx.reply(MessageText.AdminRemoved);
  } else {
    ctx.reply(MessageText.Error);
  }
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

  const db = await openDb();
  const event = await db.get('SELECT * FROM events WHERE message_id = ?', [messageId]);

  if (!event) {
    await ctx.reply(MessageText.EventNotFound);
    return;
  }

  // Check if the user is already in the list by name
  const existingAttendee = await db.get('SELECT * FROM attendees WHERE event_id = ? AND name = ?', [
    event.id,
    name,
  ]);

  if (existingAttendee) {
    await ctx.reply(MessageText.PlayerAlreadyInList);
    return;
  }

  await db.run('INSERT INTO attendees (event_id, user_id, name) VALUES (?, NULL, ?)', [
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

  const db = await openDb();
  const event = await db.get('SELECT * FROM events WHERE message_id = ?', [messageId]);

  if (!event) {
    await ctx.reply(MessageText.EventNotFound);
    return;
  }

  // Check if the player exists in the list by name
  const existingAttendee = await db.get('SELECT * FROM attendees WHERE event_id = ? AND name = ?', [
    event.id,
    name,
  ]);

  if (!existingAttendee) {
    await ctx.reply(MessageText.PlayerNotInList);
    return;
  }

  await db.run('DELETE FROM attendees WHERE event_id = ? AND name = ?', [
    event.id,
    name,
  ]);

  await updateAttendeeList(ctx, event.id, ctx.chat?.id, messageId);
};
