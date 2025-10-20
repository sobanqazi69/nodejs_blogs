import Parser from 'rss-parser';
import { NewsArticle } from '../models/NewsArticle.js';
import { continuousConfig } from '../../config/continuous.config.js';

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
            
            // Geo News (Pakistan)
            { name: 'Geo News', url: 'https://www.geo.tv/rss/1/1', category: 'pakistan' },
            { name: 'Geo Pakistan', url: 'https://www.geo.tv/rss/1/2', category: 'pakistan' },
            { name: 'Geo World', url: 'https://www.geo.tv/rss/1/3', category: 'world' },
            { name: 'Geo Business', url: 'https://www.geo.tv/rss/1/4', category: 'business' },
            { name: 'Geo Sports', url: 'https://www.geo.tv/rss/1/5', category: 'sports' },
            { name: 'Geo Technology', url: 'https://www.geo.tv/rss/1/6', category: 'technology' },
            
            // CNN
            { name: 'CNN Top Stories', url: 'http://rss.cnn.com/rss/edition.rss', category: 'international' },
            
            // The Guardian
            { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'international' },
            
            // Additional reliable sources for 24/7 operation
            { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', category: 'international' },
            { name: 'PBS News', url: 'https://www.pbs.org/newshour/feeds/rss/headlines', category: 'international' }
        ];
    }

    /**
     * Fetch news from all sources with retry logic for 24/7 operation
     */
    async fetchAllNews() {
        console.log('🌐 Fetching news from multiple platforms...');
        const allArticles = [];
        const failedSources = [];

        for (const source of this.newsSources) {
            try {
                console.log(`📡 Fetching from ${source.name}...`);
                const articles = await this.fetchSourceWithRetry(source);
                
                // Apply time-based filtering if enabled
                const filteredArticles = this.filterByTime(articles);
                allArticles.push(...filteredArticles);
                
                const filteredOut = articles.length - filteredArticles.length;
                if (filteredOut > 0) {
                    console.log(`✅ Fetched ${filteredArticles.length} recent articles from ${source.name} (${filteredOut} old articles filtered out)`);
                } else {
                    console.log(`✅ Fetched ${filteredArticles.length} articles from ${source.name}`);
                }
            } catch (error) {
                console.warn(`⚠️  Failed to fetch from ${source.name}:`, error.message);
                failedSources.push(source.name);
            }
        }

        // Remove duplicates and sort by date
        const uniqueArticles = this.removeDuplicates(allArticles);
        const sortedArticles = this.sortByDate(uniqueArticles);
        
        console.log(`📊 Total unique recent articles: ${sortedArticles.length}`);
        if (failedSources.length > 0) {
            console.log(`⚠️  Failed sources: ${failedSources.join(', ')}`);
        }
        return sortedArticles;
    }

    /**
     * Fetch from source with retry logic
     */
    async fetchSourceWithRetry(source, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.fetchSource(source);
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                console.log(`🔄 Retry ${attempt}/${maxRetries} for ${source.name}...`);
                await this.delay(1000 * attempt); // Exponential backoff
            }
        }
    }

    /**
     * Delay utility for retry logic
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Filter articles by time (only recent articles)
     */
    filterByTime(articles) {
        if (!continuousConfig.timeFiltering.enabled) {
            return articles;
        }

        const maxAgeMinutes = continuousConfig.timeFiltering.maxArticleAgeMinutes;
        const cutoffTime = new Date(Date.now() - (maxAgeMinutes * 60 * 1000));
        
        let recentCount = 0;
        let fallbackCount = 0;
        let oldCount = 0;
        
        const recentArticles = articles.filter(article => {
            if (!article.publishedDate) {
                // If no published date, include it (fallback)
                fallbackCount++;
                return continuousConfig.timeFiltering.fallbackToAll;
            }
            
            try {
                const articleDate = new Date(article.publishedDate);
                
                // If date is invalid, include it (fallback)
                if (isNaN(articleDate.getTime())) {
                    fallbackCount++;
                    return continuousConfig.timeFiltering.fallbackToAll;
                }
                
                const isRecent = articleDate >= cutoffTime;
                if (isRecent) {
                    recentCount++;
                } else {
                    oldCount++;
                }
                return isRecent;
            } catch (error) {
                // If date parsing fails, include it (fallback)
                fallbackCount++;
                return continuousConfig.timeFiltering.fallbackToAll;
            }
        });

        // Debug logging
        if (articles.length > 0) {
            console.log(`   📅 Time filter: ${recentCount} recent, ${oldCount} old, ${fallbackCount} fallback`);
        }

        return recentArticles;
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
