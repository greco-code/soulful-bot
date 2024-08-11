import {Bot} from 'grammy';
import {setupBotCommands} from './commands';
import {initDb} from './db';
import {config} from "dotenv";

config()

const bot = new Bot(process.env.BOT_TOKEN!);

// Initialize the database
initDb();

// Set up all commands
setupBotCommands(bot);

// Start the bot
bot.start();
