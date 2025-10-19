import { NewsFetcher } from './services/NewsFetcher.js';
import { DatabaseService } from './services/DatabaseService.js';
import express from 'express';

/**
 * Simple Railway App - SQLite only, no MySQL
 */
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: 'sqlite'
    });
});

app.get('/', (req, res) => {
    res.json({
        service: 'News Scraper',
        status: 'running',
        database: 'SQLite',
        message: 'Continuous scraper running on Railway'
    });
});

// Stats endpoint
app.get('/stats', async (req, res) => {
    try {
        const db = new DatabaseService();
        await db.initialize();
        const stats = await db.getStatistics();
        await db.close();
        
        res.json({
            status: 'success',
            timestamp: new Date().toISOString(),
            database: 'sqlite',
            articles: stats.length,
            sources: [...new Set(stats.map(s => s.source))],
            categories: [...new Set(stats.map(s => s.category))]
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🏥 Health server running on port ${PORT}`);
});

// Start scraper
async function startScraper() {
    try {
        console.log('🚀 Starting Railway News Scraper (SQLite)');
        
        const fetcher = new NewsFetcher();
        const db = new DatabaseService();
        
        // Initialize database
        await db.initialize();
        console.log('✅ SQLite database initialized');
        
        // Run first scrape
        console.log('🔄 Running initial scrape...');
        const articles = await fetcher.fetchAllNews();
        console.log(`📡 Fetched ${articles.length} articles`);
        
        // Store articles
        await db.insertArticles(articles);
        console.log('✅ Articles stored in database');
        
        // Set up interval for continuous scraping
        setInterval(async () => {
            try {
                console.log('⏰ Starting scheduled scrape...');
                const newArticles = await fetcher.fetchAllNews();
                
                // Simple duplicate check by URL
                const existingArticles = await db.getAllArticles(1000, 0);
                const existingUrls = new Set(existingArticles.map(a => a.url));
                const uniqueArticles = newArticles.filter(a => !existingUrls.has(a.url));
                
                if (uniqueArticles.length > 0) {
                    await db.insertArticles(uniqueArticles);
                    console.log(`✅ Added ${uniqueArticles.length} new articles`);
                } else {
                    console.log('ℹ️  No new articles found');
                }
                
            } catch (error) {
                console.error('❌ Scheduled scrape failed:', error.message);
            }
        }, 5 * 60 * 1000); // Every 5 minutes
        
        console.log('✅ Continuous scraper started');
        
    } catch (error) {
        console.error('❌ Failed to start scraper:', error.message);
    }
}

// Start scraper after server is ready
setTimeout(startScraper, 2000);
