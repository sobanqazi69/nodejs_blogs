/**
 * Continuous Scraper Configuration
 */

export const continuousConfig = {
    // Scraping interval in minutes (optimized for real-time news)
    scrapeIntervalMinutes: 1, // Check every minute for new articles
    
    // Maximum articles to process per scrape (0 = no limit)
    maxArticlesPerScrape: 0,
    
    // Enable/disable specific news sources (working sources only)
    enabledSources: [
        'Al Jazeera',
        'BBC News', 
        'BBC World',
        'BBC Business',
        'BBC Technology',
        'Dawn News',
        'Geo News',
        'Geo Pakistan',
        'Geo World',
        'Geo Business',
        'Geo Sports',
        'Geo Technology',
        'CNN Top Stories',
        'The Guardian',
        'NPR News',
        'PBS News'
    ],
    
    // Enable/disable specific categories
    enabledCategories: [
        'international',
        'world',
        'business',
        'technology',
        'pakistan',
        'sports',
        'politics'
    ],
    
    // Logging configuration
    logging: {
        // Show detailed logs for new articles
        showNewArticles: true,
        
        // Show status updates every minute
        showStatusUpdates: true,
        
        // Show scrape progress
        showScrapeProgress: true,
        
        // Log level: 'debug', 'info', 'warn', 'error'
        level: 'info'
    },
    
    // Database configuration
    database: {
        // Check for duplicates by URL (most reliable)
        checkByUrl: true,
        
        // Check for duplicates by title and source (backup)
        checkByTitle: true,
        
        // Maximum duplicate check attempts
        maxDuplicateChecks: 3
    },
    
    // Time-based filtering for real-time news
    timeFiltering: {
        // Only fetch articles published within last X minutes
        maxArticleAgeMinutes: 30, // More reasonable time window
        
        // Enable time-based filtering
        enabled: true,
        
        // Fallback to all articles if time filtering fails
        fallbackToAll: false
    },
    
    // Error handling (optimized for 24/7)
    errorHandling: {
        // Maximum consecutive errors before stopping (increased for 24/7)
        maxConsecutiveErrors: 10,
        
        // Retry delay in minutes after error
        retryDelayMinutes: 1,
        
        // Continue scraping on individual source errors
        continueOnSourceError: true,
        
        // Auto-restart on critical errors
        autoRestart: true,
        
        // Maximum restart attempts per hour
        maxRestartsPerHour: 3
    }
};
