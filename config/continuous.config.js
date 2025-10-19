/**
 * Continuous Scraper Configuration
 */

export const continuousConfig = {
    // Scraping interval in minutes
    scrapeIntervalMinutes: 5,
    
    // Maximum articles to process per scrape (0 = no limit)
    maxArticlesPerScrape: 0,
    
    // Enable/disable specific news sources
    enabledSources: [
        'Al Jazeera',
        'BBC News', 
        'BBC World',
        'BBC Business',
        'BBC Technology',
        'Dawn News',
        'CNN Top Stories',
        'The Guardian'
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
    
    // Error handling
    errorHandling: {
        // Maximum consecutive errors before stopping
        maxConsecutiveErrors: 5,
        
        // Retry delay in minutes after error
        retryDelayMinutes: 2,
        
        // Continue scraping on individual source errors
        continueOnSourceError: true
    }
};
