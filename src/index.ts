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

  // Cleanup function - MUST be set up BEFORE bot.start()
  // For testing: using 1 minute instead of 30 days
  const DAYS_OLD = process.env.NODE_ENV === 'development' ? 0.0007 : 30; // ~1 minute for dev, 30 days for prod
  let cleanupRunCount = 0;
  
  const runCleanup = async () => {
    cleanupRunCount++;
    const runNumber = cleanupRunCount;
    try {
      const threshold = DAYS_OLD < 1 ? `${Math.round(DAYS_OLD * 24 * 60)} minutes` : `${DAYS_OLD} days`;
      logger.info(`⏰ [Run #${runNumber}] Starting scheduled cleanup of old events (older than ${threshold})...`);
      const result = await cleanupOldEvents(DAYS_OLD);
      if (result.deletedEvents > 0 || result.deletedAttendees > 0) {
        logger.info(`✅ [Run #${runNumber}] Cleanup completed: ${result.deletedEvents} events and ${result.deletedAttendees} attendees removed`);
      } else {
        logger.info(`✅ [Run #${runNumber}] Cleanup completed: No old events found to delete`);
      }
    } catch (err) {
      logger.error(`❌ [Run #${runNumber}] Error during scheduled cleanup:`, err);
    }
  };

  // Schedule periodic cleanup using recursive setTimeout (MUST be before bot.start())
  // TODO: Change to 24 hours in production: 24 * 60 * 60 * 1000
  const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute in milliseconds (for testing)
  
  logger.info(`⏱️  Setting up periodic cleanup to run every ${CLEANUP_INTERVAL_MS / 1000} seconds (BEFORE bot.start())...`);
  
  const scheduleNextCleanup = () => {
    const timeoutId = setTimeout(async () => {
      try {
        logger.info(`🔔 Scheduled cleanup triggered! (Timeout ID: ${timeoutId})`);
        await runCleanup();
      } catch (err) {
        logger.error('❌ Error in scheduled cleanup, but continuing schedule:', err);
      } finally {
        // Always schedule the next one, even if there was an error
        logger.info(`📅 Scheduling next cleanup in ${CLEANUP_INTERVAL_MS / 1000} seconds...`);
        scheduleNextCleanup();
      }
    }, CLEANUP_INTERVAL_MS);
    
    logger.info(`⏰ Next cleanup scheduled with timeout ID: ${timeoutId}`);
    return timeoutId;
  };
  
  // Start the recursive scheduling BEFORE bot.start()
  const firstTimeoutId = scheduleNextCleanup();
  logger.info(`✅ Periodic cleanup scheduled (first timeout ID: ${firstTimeoutId}, runs every ${CLEANUP_INTERVAL_MS / 1000} seconds)`);
  
  // Store in global to prevent garbage collection
  (global as any).cleanupTimeoutId = firstTimeoutId;

  // Run cleanup immediately on startup (before bot.start())
  logger.info('🚀 Running initial cleanup on startup...');
  await runCleanup();

  // NOW start the bot (timers are already registered in event loop)
  await bot.start();
  logger.info('Bot started successfully');

}).catch((err) => {
  logger.error('Failed to initialize database:', err);
  process.exit(1);
});
