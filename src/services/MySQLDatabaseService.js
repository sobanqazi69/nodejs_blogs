import mysql from 'mysql2/promise';
import { getDatabaseConfig } from '../../config/database.config.js';
import { NewsArticle } from '../models/NewsArticle.js';

/**
 * MySQL Database Service - Handles MySQL database operations
 */
export class MySQLDatabaseService {
    constructor() {
        this.connection = null;
        this.config = getDatabaseConfig().config; // Use configuration from database.config.js
    }

    /**
     * Initialize database connection and create tables
     */
    async initialize() {
        try {
            // Connect to MySQL with database specified in config
            this.connection = await mysql.createConnection(this.config);
            console.log('✅ Connected to MySQL database');

            // Create tables
            await this.createTables();
            console.log('✅ Database tables created');

            // Insert default data
            await this.insertDefaultData();
            console.log('✅ Default data inserted');

        } catch (error) {
            console.error('❌ MySQL connection failed:', error.message);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error errno:', error.errno);
            console.error('❌ Error sqlState:', error.sqlState);
            console.error('❌ Full error:', error);
            throw error;
        }
    }

    /**
     * Create database tables
     */
    async createTables() {
        const createArticlesTable = `
            CREATE TABLE IF NOT EXISTS articles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                content TEXT,
                image_url VARCHAR(500),
                article_url VARCHAR(500) NOT NULL,
                published_date VARCHAR(100),
                duration VARCHAR(50),
                source VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_url (article_url)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `;

        const createCategoriesTable = `
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                description VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `;

        const createSourcesTable = `
            CREATE TABLE IF NOT EXISTS sources (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                url VARCHAR(500),
                category VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `;

        await this.connection.execute(createArticlesTable);
        await this.connection.execute(createCategoriesTable);
        await this.connection.execute(createSourcesTable);
    }

    /**
     * Insert default categories and sources
     */
    async insertDefaultData() {
        const categories = [
            { name: 'international', description: 'International news' },
            { name: 'world', description: 'World news' },
            { name: 'business', description: 'Business and finance' },
            { name: 'technology', description: 'Technology news' },
            { name: 'pakistan', description: 'Pakistan news' },
            { name: 'sports', description: 'Sports news' },
            { name: 'politics', description: 'Political news' }
        ];

        const sources = [
            { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'international' },
            { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', category: 'international' },
            { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', category: 'world' },
            { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml', category: 'business' },
            { name: 'BBC Technology', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', category: 'technology' },
            { name: 'Dawn News', url: 'https://www.dawn.com/feeds/', category: 'pakistan' },
            { name: 'CNN Top Stories', url: 'http://rss.cnn.com/rss/edition.rss', category: 'international' },
            { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'international' }
        ];

        // Insert categories
        for (const category of categories) {
            await this.insertCategory(category);
        }

        // Insert sources
        for (const source of sources) {
            await this.insertSource(source);
        }
    }

    /**
     * Insert a news article
     */
    async insertArticle(article) {
        try {
            const sql = `
                INSERT INTO articles 
                (title, content, image_url, article_url, published_date, duration, source, category)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                content = VALUES(content),
                image_url = VALUES(image_url),
                published_date = VALUES(published_date),
                duration = VALUES(duration),
                source = VALUES(source),
                category = VALUES(category)
            `;

            await this.connection.execute(sql, [
                article.title,
                article.content,
                article.image,
                article.url,
                article.publishedDate,
                article.duration,
                article.source,
                article.category
            ]);

            return true;
        } catch (error) {
            console.warn('⚠️  Error inserting article:', error.message);
            return false;
        }
    }

    /**
     * Insert multiple articles
     */
    async insertArticles(articles) {
        console.log(`💾 Storing ${articles.length} articles in MySQL database...`);
        let successCount = 0;
        let errorCount = 0;

        for (const article of articles) {
            const success = await this.insertArticle(article);
            if (success) {
                successCount++;
            } else {
                errorCount++;
            }
        }

        console.log(`✅ Successfully stored ${successCount} articles`);
        if (errorCount > 0) {
            console.log(`⚠️  ${errorCount} articles failed to store`);
        }
    }

    /**
     * Get articles by category
     */
    async getArticlesByCategory(category, limit = 50) {
        const sql = `
            SELECT * FROM articles 
            WHERE category = ? 
            ORDER BY published_date DESC, created_at DESC 
            LIMIT ?
        `;

        const [rows] = await this.connection.execute(sql, [category, limit]);
        return rows.map(row => this.rowToArticle(row));
    }

    /**
     * Get articles by source
     */
    async getArticlesBySource(source, limit = 50) {
        const sql = `
            SELECT * FROM articles 
            WHERE source = ? 
            ORDER BY published_date DESC, created_at DESC 
            LIMIT ?
        `;

        const [rows] = await this.connection.execute(sql, [source, limit]);
        return rows.map(row => this.rowToArticle(row));
    }

    /**
     * Get all articles with pagination
     */
    async getAllArticles(limit = 100, offset = 0) {
        const sql = `
            SELECT * FROM articles 
            ORDER BY published_date DESC, created_at DESC 
            LIMIT ? OFFSET ?
        `;

        const [rows] = await this.connection.execute(sql, [limit, offset]);
        return rows.map(row => this.rowToArticle(row));
    }

    /**
     * Get article statistics
     */
    async getStatistics() {
        const sql = `
            SELECT 
                category,
                source,
                COUNT(*) as count,
                MAX(published_date) as latest_article
            FROM articles 
            GROUP BY category, source
            ORDER BY count DESC
        `;

        const [rows] = await this.connection.execute(sql);
        return rows;
    }

    /**
     * Search articles by title or content
     */
    async searchArticles(searchTerm, limit = 50) {
        const sql = `
            SELECT * FROM articles 
            WHERE title LIKE ? OR content LIKE ?
            ORDER BY published_date DESC, created_at DESC 
            LIMIT ?
        `;

        const searchPattern = `%${searchTerm}%`;
        const [rows] = await this.connection.execute(sql, [searchPattern, searchPattern, limit]);
        return rows.map(row => this.rowToArticle(row));
    }

    /**
     * Insert category
     */
    async insertCategory(category) {
        const sql = 'INSERT IGNORE INTO categories (name, description) VALUES (?, ?)';
        await this.connection.execute(sql, [category.name, category.description]);
    }

    /**
     * Insert source
     */
    async insertSource(source) {
        const sql = 'INSERT IGNORE INTO sources (name, url, category) VALUES (?, ?, ?)';
        await this.connection.execute(sql, [source.name, source.url, source.category]);
    }

    /**
     * Convert database row to NewsArticle
     */
    rowToArticle(row) {
        return new NewsArticle({
            title: row.title,
            content: row.content,
            image: row.image_url,
            url: row.article_url,
            publishedDate: row.published_date,
            duration: row.duration,
            source: row.source,
            category: row.category
        });
    }

    /**
     * Close database connection
     */
    async close() {
        if (this.connection) {
            await this.connection.end();
            console.log('✅ MySQL connection closed');
        }
    }
}
