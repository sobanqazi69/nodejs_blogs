import Parser from 'rss-parser';
import { NewsArticle } from '../models/NewsArticle.js';

/**
 * Multi-Platform RSS News Fetcher
 * Fetches news from multiple major news platforms
 */
export class NewsFetcher {
    constructor() {
        this.parser = new Parser({
            customFields: {
                item: ['media:content', 'media:thumbnail', 'enclosure', 'itunes:duration', 'itunes:image']
            }
        });
        
        // Major news platforms RSS feeds
        this.newsSources = [
            // Al Jazeera
            { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'international' },
            
            // BBC News
            { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', category: 'international' },
            { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', category: 'world' },
            { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml', category: 'business' },
            { name: 'BBC Technology', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', category: 'technology' },
            
            // Dawn News (Pakistan)
            { name: 'Dawn News', url: 'https://www.dawn.com/feeds/', category: 'pakistan' },
            
            // Reuters
            { name: 'Reuters World', url: 'https://feeds.reuters.com/reuters/worldNews', category: 'world' },
            { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', category: 'business' },
            
            // CNN
            { name: 'CNN Top Stories', url: 'http://rss.cnn.com/rss/edition.rss', category: 'international' },
            
            // The Guardian
            { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'international' },
            
            // Associated Press
            { name: 'AP News', url: 'https://feeds.apnews.com/rss/apf-topnews', category: 'international' }
        ];
    }

    /**
     * Fetch news from all sources
     */
    async fetchAllNews() {
        console.log('🌐 Fetching news from multiple platforms...');
        const allArticles = [];

        for (const source of this.newsSources) {
            try {
                console.log(`📡 Fetching from ${source.name}...`);
                const articles = await this.fetchSource(source);
                allArticles.push(...articles);
                console.log(`✅ Fetched ${articles.length} articles from ${source.name}`);
            } catch (error) {
                console.warn(`⚠️  Failed to fetch from ${source.name}:`, error.message);
            }
        }

        // Remove duplicates and sort by date
        const uniqueArticles = this.removeDuplicates(allArticles);
        const sortedArticles = this.sortByDate(uniqueArticles);
        
        console.log(`📊 Total unique articles: ${sortedArticles.length}`);
        return sortedArticles;
    }

    /**
     * Fetch news from specific source
     */
    async fetchSource(source) {
        try {
            const feed = await this.parser.parseURL(source.url);
            const articles = [];

            if (feed?.items?.length > 0) {
                feed.items.forEach(item => {
                    try {
                        const article = this.parseItem(item, source);
                        if (article?.isValid()) {
                            articles.push(article);
                        }
                    } catch (error) {
                        console.warn(`⚠️  Error parsing item from ${source.name}:`, error.message);
                    }
                });
            }

            return articles;
        } catch (error) {
            throw new Error(`Failed to fetch ${source.name}: ${error.message}`);
        }
    }

    /**
     * Parse RSS item to NewsArticle
     */
    parseItem(item, source) {
        if (!item.title || !item.link) return null;

        return new NewsArticle({
            title: item.title.trim(),
            content: this.extractContent(item),
            image: this.extractImage(item),
            url: item.link,
            publishedDate: this.formatDate(item.pubDate),
            duration: this.extractDuration(item),
            source: source.name,
            category: source.category
        });
    }

    /**
     * Extract content from item
     */
    extractContent(item) {
        return item.contentSnippet || 
               item.description || 
               item.content?.replace(/<[^>]*>/g, '').trim() || 
               '';
    }

    /**
     * Extract image URL from item
     */
    extractImage(item) {
        return item['media:content']?.['$']?.url ||
               item['media:thumbnail']?.['$']?.url ||
               item['itunes:image']?.['$']?.href ||
               item.enclosure?.url ||
               null;
    }

    /**
     * Extract duration from item
     */
    extractDuration(item) {
        return item['itunes:duration'] || null;
    }

    /**
     * Format publication date
     */
    formatDate(pubDate) {
        if (!pubDate) return null;
        try {
            return new Date(pubDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch {
            return pubDate;
        }
    }

    /**
     * Remove duplicate articles
     */
    removeDuplicates(articles) {
        const seen = new Set();
        return articles.filter(article => {
            const key = `${article.title.toLowerCase()}-${article.url}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Sort articles by date (newest first)
     */
    sortByDate(articles) {
        return articles.sort((a, b) => {
            const dateA = new Date(a.publishedDate || 0);
            const dateB = new Date(b.publishedDate || 0);
            return dateB - dateA;
        });
    }

    /**
     * Get available news sources
     */
    getSources() {
        return this.newsSources.map(source => ({
            name: source.name,
            category: source.category,
            url: source.url
        }));
    }
}
