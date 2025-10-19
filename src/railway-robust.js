import { ContinuousScraper } from './services/ContinuousScraper.js';
import express from 'express';

/**
 * Robust Railway App - Won't get stuck
 */
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

app.get('/', (req, res) => {
    res.json({
        service: 'News Scraper',
        status: 'running',
        message: 'Continuous scraper with timeout protection'
    });
});

// Start server first
app.listen(PORT, () => {
    console.log(`🏥 Health server running on port ${PORT}`);
});

// Start scraper with timeout protection
async function startScraper() {
    try {
        console.log('🚀 Starting Robust Railway Scraper');
        
        const scraper = new ContinuousScraper();
        await scraper.db.initialize();
        
        // Run first scrape immediately
        await scraper.performScrape();
        
        // Set up interval with timeout protection
        setInterval(async () => {
            try {
                console.log('⏰ Starting scheduled scrape...');
                
                // Add timeout to prevent hanging
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Scrape timeout')), 300000); // 5 minutes timeout
                });
                
                const scrapePromise = scraper.performScrape();
                
                await Promise.race([scrapePromise, timeoutPromise]);
                console.log('✅ Scheduled scrape completed');
                
            } catch (error) {
                console.error('❌ Scheduled scrape failed:', error.message);
            }
        }, 5 * 60 * 1000); // Every 5 minutes
        
        console.log('✅ Scraper started successfully');
        
    } catch (error) {
        console.error('❌ Failed to start scraper:', error.message);
    }
}

// Start scraper after a short delay
setTimeout(startScraper, 2000);
