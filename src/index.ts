import { logger } from './utils';
import { Bot } from 'grammy';
import { setupBotCommands } from './commands';
import { AdminService } from './services';
import { initDb, closeDb } from './db';
import { cleanupOldEvents } from './db/event';

logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

const bot = new Bot(process.env.BOT_TOKEN!);

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await bot.stop();
    logger.info('Bot stopped gracefully');

    await closeDb();
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize and start
initDb().then(async () => {
  // Add initial admin from environment
  const initialAdminId = parseInt(process.env.ADMIN_ID || '', 10);

  if (initialAdminId) {
    const success = await AdminService.addAdmin(initialAdminId);
    if (success) {
      logger.info(`Initial admin with ID ${initialAdminId} added.`);
    } else {
      logger.info(`Admin with ID ${initialAdminId} already exists.`);
    }
  } else {
    logger.error('No ADMIN_ID configured in environment.');
  }

  setupBotCommands(bot);

  const DAYS_OLD = 30;
  
  const runCleanup = async () => {
    try {
      const result = await cleanupOldEvents(DAYS_OLD);
      if (result.deletedEvents > 0 || result.deletedAttendees > 0) {
        logger.info(`Cleanup completed: ${result.deletedEvents} events and ${result.deletedAttendees} attendees removed`);
      }
    } catch (err) {
      logger.error('Error during scheduled cleanup:', err);
    }
  };

  // Schedule periodic cleanup (runs every 24 hours)
  const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
  
  const scheduleNextCleanup = () => {
    setTimeout(async () => {
      try {
        await runCleanup();
      } catch (err) {
        logger.error('Error in scheduled cleanup:', err);
      } finally {
        scheduleNextCleanup();
      }
    }, CLEANUP_INTERVAL_MS);
  };
  
  scheduleNextCleanup();
  await runCleanup();

  // NOW start the bot (timers are already registered in event loop)
  await bot.start();
  logger.info('Bot started successfully');

}).catch((err) => {
  logger.error('Failed to initialize database:', err);
  process.exit(1);
});
