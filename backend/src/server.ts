import 'reflect-metadata';
import app from './app';
import { config } from './config/config';
import { logger } from './utils/logger';
import { initializeDatabase } from './config/database';

const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info('Database connection established');

    // Start the server
    const server = app.listen(config.port, () => {
      logger.info(`
        ╔════════════════════════════════════════════════════════╗
        ║                                                        ║
        ║   🚀 HRMS SaaS API Server Started Successfully        ║
        ║                                                        ║
        ║   Environment: ${config.nodeEnv.padEnd(39)}║
        ║   Port:        ${config.port.toString().padEnd(39)}║
        ║   API Version: ${config.apiVersion.padEnd(39)}║
        ║                                                        ║
        ║   📚 API Docs: http://localhost:${config.port}/api/docs      ║
        ║   🏥 Health:   http://localhost:${config.port}/health        ║
        ║                                                        ║
        ╚════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connection
        try {
          // await closeDatabase();
          logger.info('Database connection closed');
        } catch (error) {
          logger.error('Error closing database connection:', error);
        }

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
