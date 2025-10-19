import { ContinuousScraper } from './services/ContinuousScraper.js';
import './health.js'; // Start health check server

/**
 * Railway Continuous News Scraper
 * Runs continuously on Railway with health checks
 */
class RailwayNewsApp {
    constructor() {
        this.scraper = new ContinuousScraper();
        this.isShuttingDown = false;
    }

    /**
     * Start the application
     */
    async run() {
        try {
            console.log('🚀 Starting Railway News Scraper');
            console.log('================================');
            console.log('🌐 Environment:', process.env.NODE_ENV || 'production');
            console.log('⏰ Scraping interval:', process.env.SCRAPE_INTERVAL_MINUTES || 5, 'minutes');
            console.log('');

            // Setup graceful shutdown
            this.setupGracefulShutdown();
            
            // Start continuous scraping
            await this.scraper.start();
            
        } catch (error) {
            console.error('❌ Application failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Setup graceful shutdown handlers
     */
    setupGracefulShutdown() {
        // Handle SIGTERM (Railway shutdown signal)
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Received SIGTERM (Railway shutdown)');
            await this.gracefulShutdown();
        });

        // Handle SIGINT (Ctrl+C)
        process.on('SIGINT', async () => {
            console.log('\n🛑 Received SIGINT (Ctrl+C)');
            await this.gracefulShutdown();
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', async (error) => {
            console.error('❌ Uncaught Exception:', error.message);
            await this.gracefulShutdown();
            process.exit(1);
        });

        // Handle unhandled rejections
        process.on('unhandledRejection', async (reason, promise) => {
            console.error('❌ Unhandled Rejection:', reason);
            await this.gracefulShutdown();
            process.exit(1);
        });
    }

    /**
     * Graceful shutdown
     */
    async gracefulShutdown() {
        if (this.isShuttingDown) {
            console.log('⚠️  Shutdown already in progress');
            return;
        }

        this.isShuttingDown = true;
        console.log('🛑 Starting graceful shutdown...');

        try {
            await this.scraper.stop();
            console.log('✅ Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during shutdown:', error.message);
            process.exit(1);
        }
    }
}

// Run the application
const app = new RailwayNewsApp();
app.run().catch(error => {
    console.error('❌ Application error:', error.message);
    process.exit(1);
});
