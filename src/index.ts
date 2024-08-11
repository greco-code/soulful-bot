import {Bot} from 'grammy';
import {setupBotCommands} from './commands';
import {addAdmin, isAdmin, initDb} from './db';
import {config} from 'dotenv';

config();

const bot = new Bot(process.env.BOT_TOKEN!);

// Initialize the database and start the bot
initDb().then(async () => {
  // Add initial admin from .env file
  const initialAdminId = parseInt(process.env.ADMIN_ID || '', 10);

  if (initialAdminId) {
    const isInitialAdmin = await isAdmin(initialAdminId);
    if (!isInitialAdmin) {
      await addAdmin(initialAdminId);
      console.log(`Initial admin with ID ${initialAdminId} added.`);
    } else {
      console.log(`Admin with ID ${initialAdminId} already exists.`);
    }
  } else {
    console.error('No ADMIN_ID found in .env file.');
  }

  // Set up all commands
  setupBotCommands(bot);

  // Start the bot
  bot.start();
}).catch((err) => {
  console.error('Failed to initialize database:', err);
});
