#!/usr/bin/env node

/**
 * 24/7 News Scraper Startup Script
 * Production-ready script for continuous operation
 */

import { ContinuousScraper } from './src/services/ContinuousScraper.js';

/**
 * Main 24/7 scraper application
 */
class NewsScraper24_7 {
    constructor() {
        this.scraper = new ContinuousScraper();
        this.isShuttingDown = false;
    }

    /**
     * Start the 24/7 scraper
     */
    async start() {
        try {
            console.log('🚀 Starting 24/7 News Scraper');
            console.log('================================');
            console.log('📅 Started at:', new Date().toLocaleString());
            console.log('🔄 Mode: Continuous (24/7)');
            console.log('⏰ Scraping every 3 minutes');
            console.log('🛑 Press Ctrl+C to stop gracefully');
            console.log('');

            // Start the scraper
            await this.scraper.start();

            // Keep the process alive
            this.keepAlive();

        } catch (error) {
            console.error('❌ Failed to start 24/7 scraper:', error.message);
            process.exit(1);
        }
    }

    /**
     * Keep the process alive for 24/7 operation
     */
    keepAlive() {
        // This keeps the Node.js event loop running
        setInterval(() => {
            if (this.isShuttingDown) {
                return;
            }
            // Just keep the process alive
        }, 1000);
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        if (this.isShuttingDown) {
            return;
        }
        
        this.isShuttingDown = true;
        console.log('\n🛑 Shutting down 24/7 scraper...');
        
        try {
            await this.scraper.stop();
            console.log('✅ 24/7 scraper stopped gracefully');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during shutdown:', error.message);
            process.exit(1);
        }
    }
}

// Create and start the 24/7 scraper
const app = new NewsScraper24_7();

// Handle graceful shutdown
process.on('SIGINT', () => app.shutdown());
process.on('SIGTERM', () => app.shutdown());

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    console.error('🔄 Attempting to restart...');
    setTimeout(() => {
        app.start().catch(() => process.exit(1));
    }, 5000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    console.error('🔄 Attempting to restart...');
    setTimeout(() => {
        app.start().catch(() => process.exit(1));
    }, 5000);
});

// Start the application
app.start().catch((error) => {
    console.error('❌ Failed to start application:', error.message);
    process.exit(1);
});
