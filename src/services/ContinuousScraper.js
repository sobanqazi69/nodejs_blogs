import { NewsFetcher } from './NewsFetcher.js';
import { DatabaseFactory } from './DatabaseFactory.js';
import { continuousConfig } from '../../config/continuous.config.js';

/**
 * Continuous News Scraper - Runs every 5 minutes and adds only new articles
 */
export class ContinuousScraper {
    constructor() {
        this.fetcher = new NewsFetcher();
        this.db = DatabaseFactory.create();
        this.isRunning = false;
        this.intervalId = null;
        this.scrapeInterval = continuousConfig.scrapeIntervalMinutes * 60 * 1000; // Convert to milliseconds
        this.lastScrapeTime = null;
        this.totalArticlesAdded = 0;
        this.totalScrapes = 0;
        this.consecutiveErrors = 0;
        this.config = continuousConfig;
    }

    /**
     * Start continuous scraping
     */
    async start() {
        try {
            console.log('🚀 Starting Continuous News Scraper');
            console.log('==================================');
            console.log(`⏰ Scraping every ${this.config.scrapeIntervalMinutes} minutes`);
            console.log('🔄 Press Ctrl+C to stop');
            console.log('');

            // Initialize database
            await this.db.initialize();
            this.isRunning = true;

            // Run first scrape immediately
            await this.performScrape();

            // Set up interval for continuous scraping
            this.intervalId = setInterval(async () => {
                if (this.isRunning) {
                    await this.performScrape();
                }
            }, this.scrapeInterval);

            // Show status every minute
            this.startStatusUpdates();

        } catch (error) {
            console.error('❌ Failed to start continuous scraper:', error.message);
            process.exit(1);
        }
    }

    /**
     * Stop continuous scraping
     */
    async stop() {
        console.log('\n🛑 Stopping continuous scraper...');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        await this.db.close();
        console.log('✅ Continuous scraper stopped');
        console.log(`📊 Total articles added: ${this.totalArticlesAdded}`);
        console.log(`📊 Total scrapes performed: ${this.totalScrapes}`);
    }

    /**
     * Perform a single scrape operation
     */
    async performScrape() {
        try {
            this.totalScrapes++;
            const startTime = new Date();
            this.lastScrapeTime = startTime;

            console.log(`\n🔄 Scrape #${this.totalScrapes} - ${startTime.toLocaleTimeString()}`);
            console.log('─'.repeat(50));

            // Fetch all news
            const articles = await this.fetcher.fetchAllNews();
            console.log(`📡 Fetched ${articles.length} articles from RSS feeds`);

            // Filter out duplicates and get only new articles
            const newArticles = await this.filterNewArticles(articles);
            
            if (newArticles.length > 0) {
                // Store new articles
                await this.db.insertArticles(newArticles);
                this.totalArticlesAdded += newArticles.length;
                
                console.log(`✅ Added ${newArticles.length} new articles to database`);
                this.showNewArticles(newArticles);
            } else {
                console.log('ℹ️  No new articles found');
            }

            const endTime = new Date();
            const duration = Math.round((endTime - startTime) / 1000);
            console.log(`⏱️  Scrape completed in ${duration} seconds`);

            // Reset error counter on successful scrape
            this.consecutiveErrors = 0;

        } catch (error) {
            this.consecutiveErrors++;
            console.error('❌ Error during scrape:', error.message);
            
            // Check if we should stop due to too many consecutive errors
            if (this.consecutiveErrors >= this.config.errorHandling.maxConsecutiveErrors) {
                console.error(`❌ Too many consecutive errors (${this.consecutiveErrors}). Stopping scraper.`);
                await this.stop();
                process.exit(1);
            }
        }
    }

    /**
     * Filter out duplicate articles and return only new ones
     */
    async filterNewArticles(articles) {
        const newArticles = [];

        for (const article of articles) {
            try {
                // Check if article already exists in database
                const exists = await this.checkArticleExists(article);
                
                if (!exists) {
                    newArticles.push(article);
                }
            } catch (error) {
                console.warn(`⚠️  Error checking article "${article.title}":`, error.message);
            }
        }

        return newArticles;
    }

    /**
     * Check if article already exists in database
     */
    async checkArticleExists(article) {
        try {
            // Check by URL (most reliable)
            const existingByUrl = await this.db.searchArticles(article.url, 1);
            if (existingByUrl.length > 0) {
                return true;
            }

            // Check by title and source (backup check)
            const existingByTitle = await this.db.searchArticles(article.title, 10);
            const duplicate = existingByTitle.find(existing => 
                existing.title.toLowerCase() === article.title.toLowerCase() &&
                existing.source === article.source
            );

            return duplicate !== undefined;

        } catch (error) {
            console.warn(`⚠️  Error checking article existence:`, error.message);
            return false; // If we can't check, assume it's new
        }
    }

    /**
     * Show new articles that were added
     */
    showNewArticles(articles) {
        console.log('\n📰 NEW ARTICLES ADDED:');
        console.log('─'.repeat(30));
        
        // Group by source
        const groupedBySource = {};
        articles.forEach(article => {
            if (!groupedBySource[article.source]) {
                groupedBySource[article.source] = [];
            }
            groupedBySource[article.source].push(article);
        });

        Object.keys(groupedBySource).forEach(source => {
            const sourceArticles = groupedBySource[source];
            console.log(`\n📂 ${source} (${sourceArticles.length} new articles):`);
            
            sourceArticles.slice(0, 3).forEach((article, index) => {
                console.log(`   ${index + 1}. ${article.title}`);
                console.log(`      📅 ${article.publishedDate || 'N/A'} | 🏷️  ${article.category}`);
            });
            
            if (sourceArticles.length > 3) {
                console.log(`   ... and ${sourceArticles.length - 3} more articles`);
            }
        });
    }

    /**
     * Start status updates every minute
     */
    startStatusUpdates() {
        setInterval(() => {
            if (this.isRunning) {
                const now = new Date();
                const timeSinceLastScrape = this.lastScrapeTime 
                    ? Math.round((now - this.lastScrapeTime) / 60000)
                    : 'N/A';
                
                console.log(`\n📊 Status: ${now.toLocaleTimeString()} | Last scrape: ${timeSinceLastScrape} min ago | Total added: ${this.totalArticlesAdded}`);
            }
        }, 60000); // Every minute
    }

    /**
     * Get scraper statistics
     */
    getStats() {
        return {
            isRunning: this.isRunning,
            totalScrapes: this.totalScrapes,
            totalArticlesAdded: this.totalArticlesAdded,
            lastScrapeTime: this.lastScrapeTime,
            scrapeInterval: this.scrapeInterval
        };
    }
}
