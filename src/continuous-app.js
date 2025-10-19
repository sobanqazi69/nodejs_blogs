import { ContinuousScraper } from './services/ContinuousScraper.js';

/**
 * Continuous News Scraper Application
 * Runs continuously and adds only new articles to database
 */
class ContinuousNewsApp {
    constructor() {
        this.scraper = new ContinuousScraper();
    }

    /**
     * Start continuous scraping
     */
    async run() {
        try {
            // Handle graceful shutdown
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
        // Handle Ctrl+C
        process.on('SIGINT', async () => {
            console.log('\n\n🛑 Received SIGINT (Ctrl+C)');
            await this.scraper.stop();
            process.exit(0);
        });

        // Handle termination
        process.on('SIGTERM', async () => {
            console.log('\n\n🛑 Received SIGTERM');
            await this.scraper.stop();
            process.exit(0);
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', async (error) => {
            console.error('❌ Uncaught Exception:', error.message);
            await this.scraper.stop();
            process.exit(1);
        });

        // Handle unhandled rejections
        process.on('unhandledRejection', async (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            await this.scraper.stop();
            process.exit(1);
        });
    }
}

// Run the continuous scraper
const app = new ContinuousNewsApp();
app.run().catch(error => {
    console.error('❌ Application error:', error.message);
    process.exit(1);
});
