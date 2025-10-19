import sqlite3 from 'sqlite3';
import { NewsArticle } from '../models/NewsArticle.js';

/**
 * Database Service - Handles SQLite database operations
 */
export class DatabaseService {
    constructor(dbPath = 'news.db') {
        this.dbPath = dbPath;
        this.db = null;
    }

    /**
     * Initialize database connection and create tables
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Database connection failed:', err.message);
                    reject(err);
                    return;
                }
                console.log('✅ Connected to SQLite database');
                this.createTables().then(resolve).catch(reject);
            });
        });
    }

    /**
     * Create database tables
     */
    async createTables() {
        return new Promise((resolve, reject) => {
            const createArticlesTable = `
                CREATE TABLE IF NOT EXISTS articles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT,
                    image_url TEXT,
                    article_url TEXT NOT NULL,
                    published_date TEXT,
                    duration TEXT,
                    source TEXT NOT NULL,
                    category TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(article_url)
                )
            `;

            const createCategoriesTable = `
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const createSourcesTable = `
                CREATE TABLE IF NOT EXISTS sources (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    url TEXT,
                    category TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            this.db.exec(createArticlesTable, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('✅ Articles table created');

                this.db.exec(createCategoriesTable, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log('✅ Categories table created');

                    this.db.exec(createSourcesTable, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        console.log('✅ Sources table created');
                        this.insertDefaultData().then(resolve).catch(reject);
                    });
                });
            });
        });
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

        console.log('✅ Default data inserted');
    }

    /**
     * Insert a news article
     */
    async insertArticle(article) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT OR REPLACE INTO articles 
                (title, content, image_url, article_url, published_date, duration, source, category)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [
                article.title,
                article.content,
                article.image,
                article.url,
                article.publishedDate,
                article.duration,
                article.source,
                article.category
            ], function(err) {
                if (err) {
                    console.warn('⚠️  Error inserting article:', err.message);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    /**
     * Insert multiple articles
     */
    async insertArticles(articles) {
        console.log(`💾 Storing ${articles.length} articles in database...`);
        let successCount = 0;
        let errorCount = 0;

        for (const article of articles) {
            try {
                await this.insertArticle(article);
                successCount++;
            } catch (error) {
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
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM articles 
                WHERE category = ? 
                ORDER BY published_date DESC, created_at DESC 
                LIMIT ?
            `;

            this.db.all(sql, [category, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => this.rowToArticle(row)));
                }
            });
        });
    }

    /**
     * Get articles by source
     */
    async getArticlesBySource(source, limit = 50) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM articles 
                WHERE source = ? 
                ORDER BY published_date DESC, created_at DESC 
                LIMIT ?
            `;

            this.db.all(sql, [source, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => this.rowToArticle(row)));
                }
            });
        });
    }

    /**
     * Get all articles with pagination
     */
    async getAllArticles(limit = 100, offset = 0) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM articles 
                ORDER BY published_date DESC, created_at DESC 
                LIMIT ? OFFSET ?
            `;

            this.db.all(sql, [limit, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => this.rowToArticle(row)));
                }
            });
        });
    }

    /**
     * Get article statistics
     */
    async getStatistics() {
        return new Promise((resolve, reject) => {
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

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Search articles by title or content
     */
    async searchArticles(searchTerm, limit = 50) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM articles 
                WHERE title LIKE ? OR content LIKE ?
                ORDER BY published_date DESC, created_at DESC 
                LIMIT ?
            `;

            const searchPattern = `%${searchTerm}%`;
            this.db.all(sql, [searchPattern, searchPattern, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => this.rowToArticle(row)));
                }
            });
        });
    }

    /**
     * Insert category
     */
    async insertCategory(category) {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)';
            this.db.run(sql, [category.name, category.description], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Insert source
     */
    async insertSource(source) {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT OR IGNORE INTO sources (name, url, category) VALUES (?, ?, ?)';
            this.db.run(sql, [source.name, source.url, source.category], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
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
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err.message);
                    } else {
                        console.log('✅ Database connection closed');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}
