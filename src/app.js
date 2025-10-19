import { NewsFetcher } from './services/NewsFetcher.js';
import { DatabaseFactory } from './services/DatabaseFactory.js';

/**
 * Multi-Platform News RSS Fetcher with Database Storage
 * Fetches latest news and stores in database (SQLite or MySQL)
 */
class NewsApp {
    constructor() {
        this.fetcher = new NewsFetcher();
        this.db = DatabaseFactory.create();
    }

    /**
     * Main application entry point
     */
    async run() {
        try {
            console.log('🚀 Multi-Platform News Fetcher with Database');
            console.log('===============================================');
            
            // Initialize database
            await this.db.initialize();
            
            // Show available sources
            this.showSources();
            
            // Fetch all news
            const articles = await this.fetcher.fetchAllNews();
            
            // Store in database
            await this.db.insertArticles(articles);
            
            // Display results
            this.displayResults(articles);
            
            // Save to file
            await this.saveResults(articles);
            
            // Show database statistics
            await this.showDatabaseStats();
            
        } catch (error) {
            console.error('❌ Application failed:', error.message);
            process.exit(1);
        } finally {
            // Close database connection
            await this.db.close();
        }
    }

    /**
     * Show available news sources
     */
    showSources() {
        const sources = this.fetcher.getSources();
        console.log('\n📡 Available News Sources:');
        sources.forEach(source => {
            console.log(`   • ${source.name} (${source.category})`);
        });
        console.log('');
    }

    /**
     * Display news articles in console
     */
    displayResults(articles) {
        console.log('\n📰 LATEST NEWS ARTICLES');
        console.log('========================');
        
        if (articles.length === 0) {
            console.log('❌ No articles found');
            return;
        }

        // Group by source
        const grouped = this.groupBySource(articles);
        
        Object.keys(grouped).forEach(source => {
            const sourceArticles = grouped[source];
            console.log(`\n📂 ${source.toUpperCase()} (${sourceArticles.length} articles)`);
            console.log('─'.repeat(50));
            
            sourceArticles.slice(0, 5).forEach((article, index) => {
                console.log(`\n${index + 1}. ${article.title}`);
                console.log(`   📅 ${article.publishedDate || 'N/A'} | ⏱️  ${article.duration || 'N/A'}`);
                console.log(`   🔗 ${article.url}`);
                
                if (article.content) {
                    const preview = article.content.length > 80 
                        ? article.content.substring(0, 80) + '...' 
                        : article.content;
                    console.log(`   📝 ${preview}`);
                }
            });
            
            if (sourceArticles.length > 5) {
                console.log(`   ... and ${sourceArticles.length - 5} more articles`);
            }
        });

        console.log(`\n✅ Successfully fetched ${articles.length} articles from ${Object.keys(grouped).length} sources`);
    }

    /**
     * Group articles by source
     */
    groupBySource(articles) {
        const grouped = {};
        articles.forEach(article => {
            if (!grouped[article.source]) {
                grouped[article.source] = [];
            }
            grouped[article.source].push(article);
        });
        return grouped;
    }

    /**
     * Save results to JSON file
     */
    async saveResults(articles) {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `news-${timestamp}.json`;
            const filepath = path.join(process.cwd(), 'logs', filename);
            
            const data = {
                timestamp: new Date().toISOString(),
                totalArticles: articles.length,
                sources: Object.keys(this.groupBySource(articles)),
                articles: articles.map(article => article.toJSON())
            };
            
            await fs.writeFile(filepath, JSON.stringify(data, null, 2));
            console.log(`\n💾 Results saved to: ${filepath}`);
            
        } catch (error) {
            console.warn('⚠️  Failed to save results:', error.message);
        }
    }

    /**
     * Show database statistics
     */
    async showDatabaseStats() {
        try {
            console.log('\n📊 DATABASE STATISTICS');
            console.log('=====================');
            
            const stats = await this.db.getStatistics();
            
            console.log('\n📂 Articles by Category and Source:');
            stats.forEach(stat => {
                console.log(`   ${stat.category} | ${stat.source}: ${stat.count} articles`);
            });

            console.log('\n💡 Use database CLI to explore articles:');
            console.log('   node src/database-cli.js stats');
            console.log('   node src/database-cli.js category international');
            console.log('   node src/database-cli.js search "trump"');
            
        } catch (error) {
            console.warn('⚠️  Failed to get database statistics:', error.message);
        }
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});

// Run application
const app = new NewsApp();
app.run().catch(error => {
    console.error('❌ Application error:', error.message);
    process.exit(1);
});
