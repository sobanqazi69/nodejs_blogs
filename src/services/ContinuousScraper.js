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
        this.startTime = new Date();
        this.lastSuccessfulScrape = null;
        this.statusInterval = null;
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

            // Show status every 5 minutes for real-time monitoring
            this.startStatusUpdates();

            // Handle process exit gracefully
            process.on('SIGINT', async () => {
                console.log('\n🛑 Received SIGINT, stopping scraper gracefully...');
                await this.stop();
                process.exit(0);
            });

            process.on('SIGTERM', async () => {
                console.log('\n🛑 Received SIGTERM, stopping scraper gracefully...');
                await this.stop();
                process.exit(0);
            });

            // Handle uncaught exceptions
            process.on('uncaughtException', async (error) => {
                console.error('❌ Uncaught Exception:', error.message);
                console.error('🔄 Attempting to restart scraper...');
                await this.restart();
            });

            // Handle unhandled promise rejections
            process.on('unhandledRejection', async (reason, promise) => {
                console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
                console.error('🔄 Attempting to restart scraper...');
                await this.restart();
            });

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
        
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
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
            this.lastSuccessfulScrape = new Date();

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
        let duplicateCount = 0;

        console.log(`🔍 Checking ${articles.length} articles for duplicates...`);

        for (const article of articles) {
            try {
                // Check if article already exists in database using multiple methods
                const exists = await this.checkArticleExists(article);
                
                if (!exists) {
                    newArticles.push(article);
                } else {
                    duplicateCount++;
                }
            } catch (error) {
                console.warn(`⚠️  Error checking article "${article.title}":`, error.message);
                // If we can't check, include it to be safe
                newArticles.push(article);
            }
        }

        console.log(`📊 Duplicate check: ${newArticles.length} new, ${duplicateCount} duplicates`);
        return newArticles;
    }

    /**
     * Check if article already exists in database using multiple strategies
     */
    async checkArticleExists(article) {
        try {
            // Strategy 1: Check by URL (most reliable)
            if (article.url) {
                const existingByUrl = await this.db.searchArticles(article.url, 1);
                if (existingByUrl.length > 0) {
                    return true;
                }
            }

            // Strategy 2: Check by title and source (backup check)
            if (article.title) {
                const existingByTitle = await this.db.searchArticles(article.title, 10);
                const duplicate = existingByTitle.find(existing => 
                    existing.title.toLowerCase() === article.title.toLowerCase() &&
                    existing.source === article.source
                );
                if (duplicate) {
                    return true;
                }
            }

            // Strategy 3: Check by content similarity (for articles with similar content)
            if (article.content && article.content.length > 50) {
                const contentWords = article.content.toLowerCase().split(/\s+/).slice(0, 20);
                const existingByContent = await this.db.searchArticles(contentWords.join(' '), 20);
                const contentDuplicate = existingByContent.find(existing => 
                    existing.source === article.source &&
                    this.calculateSimilarity(existing.title.toLowerCase(), article.title.toLowerCase()) > 0.8
                );
                if (contentDuplicate) {
                    return true;
                }
            }

            return false;

        } catch (error) {
            console.warn(`⚠️  Error checking article existence:`, error.message);
            return false; // If we can't check, assume it's new
        }
    }

    /**
     * Calculate similarity between two strings (simple Jaccard similarity)
     */
    calculateSimilarity(str1, str2) {
        const words1 = new Set(str1.split(/\s+/));
        const words2 = new Set(str2.split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
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
     * Start status updates every 5 minutes for real-time monitoring
     */
    startStatusUpdates() {
        this.statusInterval = setInterval(() => {
            if (this.isRunning) {
                this.showDetailedStatus();
            }
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    /**
     * Show detailed status for 24/7 monitoring
     */
    showDetailedStatus() {
        const now = new Date();
        const uptime = Math.round((now - this.startTime) / 60000); // minutes
        const timeSinceLastScrape = this.lastScrapeTime 
            ? Math.round((now - this.lastScrapeTime) / 60000)
            : 'N/A';
        const timeSinceLastSuccess = this.lastSuccessfulScrape
            ? Math.round((now - this.lastSuccessfulScrape) / 60000)
            : 'N/A';

        console.log('\n' + '='.repeat(70));
        console.log('📊 REAL-TIME NEWS SCRAPER STATUS REPORT');
        console.log('='.repeat(70));
        console.log(`🕐 Current Time: ${now.toLocaleString()}`);
        console.log(`⏱️  Uptime: ${uptime} minutes`);
        console.log(`🔄 Total Scrapes: ${this.totalScrapes}`);
        console.log(`📰 Total Articles Added: ${this.totalArticlesAdded}`);
        console.log(`⏰ Last Scrape: ${timeSinceLastScrape} minutes ago`);
        console.log(`✅ Last Success: ${timeSinceLastSuccess} minutes ago`);
        console.log(`❌ Consecutive Errors: ${this.consecutiveErrors}`);
        console.log(`🔄 Scrape Interval: ${this.scrapeInterval / 60000} minute(s)`);
        console.log(`⏱️  Time Filter: Only articles < 5 minutes old`);
        console.log(`🔍 Duplicate Check: Enhanced (URL + Title + Content)`);
        console.log('='.repeat(70));
    }

    /**
     * Restart the scraper (for error recovery)
     */
    async restart() {
        console.log('🔄 Restarting scraper...');
        try {
            await this.stop();
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            await this.start();
        } catch (error) {
            console.error('❌ Failed to restart scraper:', error.message);
            process.exit(1);
        }
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
