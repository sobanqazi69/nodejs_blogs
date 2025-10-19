import { DatabaseFactory } from './services/DatabaseFactory.js';

/**
 * Database CLI Tool - Manage news database
 */
class DatabaseCLI {
    constructor() {
        this.db = DatabaseFactory.create();
    }

    /**
     * Initialize database
     */
    async init() {
        try {
            console.log('🚀 Initializing database...');
            await this.db.initialize();
            console.log('✅ Database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Show database statistics
     */
    async stats() {
        try {
            console.log('📊 Database Statistics');
            console.log('=====================');
            
            const statistics = await this.db.getStatistics();
            
            console.log('\n📂 Articles by Category and Source:');
            statistics.forEach(stat => {
                console.log(`   ${stat.category} | ${stat.source}: ${stat.count} articles`);
                console.log(`   Latest: ${stat.latest_article || 'N/A'}`);
                console.log('');
            });

            // Get total count
            const allArticles = await this.db.getAllArticles(1, 0);
            console.log(`📈 Total articles in database: ${allArticles.length > 0 ? 'Multiple articles found' : 'No articles'}`);
            
        } catch (error) {
            console.error('❌ Error getting statistics:', error.message);
        }
    }

    /**
     * Show articles by category
     */
    async showByCategory(category, limit = 10) {
        try {
            console.log(`📰 Articles in ${category.toUpperCase()} category:`);
            console.log('='.repeat(50));
            
            const articles = await this.db.getArticlesByCategory(category, limit);
            
            if (articles.length === 0) {
                console.log('❌ No articles found in this category');
                return;
            }

            articles.forEach((article, index) => {
                console.log(`\n${index + 1}. ${article.title}`);
                console.log(`   📅 ${article.publishedDate || 'N/A'} | 🔗 ${article.url}`);
                console.log(`   📝 ${article.content ? article.content.substring(0, 100) + '...' : 'No content'}`);
            });

            console.log(`\n✅ Showing ${articles.length} articles from ${category} category`);
            
        } catch (error) {
            console.error('❌ Error fetching articles:', error.message);
        }
    }

    /**
     * Show articles by source
     */
    async showBySource(source, limit = 10) {
        try {
            console.log(`📰 Articles from ${source.toUpperCase()}:`);
            console.log('='.repeat(50));
            
            const articles = await this.db.getArticlesBySource(source, limit);
            
            if (articles.length === 0) {
                console.log('❌ No articles found from this source');
                return;
            }

            articles.forEach((article, index) => {
                console.log(`\n${index + 1}. ${article.title}`);
                console.log(`   📅 ${article.publishedDate || 'N/A'} | 🏷️  ${article.category}`);
                console.log(`   📝 ${article.content ? article.content.substring(0, 100) + '...' : 'No content'}`);
            });

            console.log(`\n✅ Showing ${articles.length} articles from ${source}`);
            
        } catch (error) {
            console.error('❌ Error fetching articles:', error.message);
        }
    }

    /**
     * Search articles
     */
    async search(searchTerm, limit = 10) {
        try {
            console.log(`🔍 Searching for: "${searchTerm}"`);
            console.log('='.repeat(50));
            
            const articles = await this.db.searchArticles(searchTerm, limit);
            
            if (articles.length === 0) {
                console.log('❌ No articles found matching your search');
                return;
            }

            articles.forEach((article, index) => {
                console.log(`\n${index + 1}. ${article.title}`);
                console.log(`   📅 ${article.publishedDate || 'N/A'} | 🏷️  ${article.category} | 📰 ${article.source}`);
                console.log(`   📝 ${article.content ? article.content.substring(0, 100) + '...' : 'No content'}`);
            });

            console.log(`\n✅ Found ${articles.length} articles matching "${searchTerm}"`);
            
        } catch (error) {
            console.error('❌ Error searching articles:', error.message);
        }
    }

    /**
     * Show help
     */
    showHelp() {
        console.log('📚 Database CLI Commands:');
        console.log('========================');
        console.log('  node src/database-cli.js init                    - Initialize database');
        console.log('  node src/database-cli.js stats                   - Show statistics');
        console.log('  node src/database-cli.js category <name> [limit] - Show articles by category');
        console.log('  node src/database-cli.js source <name> [limit]   - Show articles by source');
        console.log('  node src/database-cli.js search <term> [limit]   - Search articles');
        console.log('');
        console.log('Examples:');
        console.log('  node src/database-cli.js category international 10');
        console.log('  node src/database-cli.js source "BBC News" 5');
        console.log('  node src/database-cli.js search "trump" 20');
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const param1 = args[1];
const param2 = args[2];

const cli = new DatabaseCLI();

// Handle commands
switch (command) {
    case 'init':
        cli.init().then(() => process.exit(0));
        break;
        
    case 'stats':
        cli.init().then(() => cli.stats()).then(() => process.exit(0));
        break;
        
    case 'category':
        if (!param1) {
            console.log('❌ Please specify a category name');
            process.exit(1);
        }
        cli.init().then(() => cli.showByCategory(param1, parseInt(param2) || 10)).then(() => process.exit(0));
        break;
        
    case 'source':
        if (!param1) {
            console.log('❌ Please specify a source name');
            process.exit(1);
        }
        cli.init().then(() => cli.showBySource(param1, parseInt(param2) || 10)).then(() => process.exit(0));
        break;
        
    case 'search':
        if (!param1) {
            console.log('❌ Please specify a search term');
            process.exit(1);
        }
        cli.init().then(() => cli.search(param1, parseInt(param2) || 10)).then(() => process.exit(0));
        break;
        
    default:
        cli.showHelp();
        process.exit(0);
}
