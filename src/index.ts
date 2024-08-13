import {logger} from './utils';
import {Bot} from 'grammy';
import {setupBotCommands} from './commands';
import {addAdmin, isAdmin, initDb} from './db';
import {config} from 'dotenv';

if (process.env.NODE_ENV === 'development') {
  logger.info('Environment: Local');
  config({path: '.env.local'});
} else {
  logger.info('Environment: Dev');
  config({path: '.env'});
}

const bot = new Bot(process.env.BOT_TOKEN!);

// Initialize the database and start the bot
initDb().then(async () => {
  // Add initial admin from .env file
  const initialAdminId = parseInt(process.env.ADMIN_ID || '', 10);

  if (initialAdminId) {
    const isInitialAdmin = await isAdmin(initialAdminId);
    if (!isInitialAdmin) {
      await addAdmin(initialAdminId);
      logger.info(`Initial admin with ID ${initialAdminId} added.`);
    } else {
      logger.info(`Admin with ID ${initialAdminId} already exists.`);
    }
  } else {
    logger.error('No ADMIN_ID found in .env file.');
  }

  // Set up all commands
  setupBotCommands(bot);

  // Start the bot
  bot.start();
}).catch((err) => {
  logger.error('Failed to initialize database:', err);
});
