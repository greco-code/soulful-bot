import {createLogger, format, transports} from 'winston';

const {combine, timestamp, printf, colorize} = format;

// Custom log format
const customFormat = printf(({level, message, timestamp}) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Create the logger
export const logger = createLogger({
  level: 'info', // You can set the logging level (info, warn, error, debug, etc.)
  format: combine(
      colorize(), // Adds color to the console logs
      timestamp(), // Adds a timestamp to each log
      customFormat // Uses the custom format
  ),
  transports: [
    new transports.Console(), // Log to the console
    new transports.File({filename: 'logs/error.log', level: 'error'}), // Log errors to a file
    new transports.File({filename: 'logs/combined.log'}) // Log everything to a file
  ],
});
