import express from 'express';

/**
 * Health Check Server for Railway
 * Provides health check endpoint and basic monitoring
 */
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    });
});

// Basic info endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'News Scraper',
        status: 'running',
        description: 'Continuous news scraper running in background',
        endpoints: {
            health: '/health',
            stats: '/stats'
        }
    });
});

// Stats endpoint (if database is available)
app.get('/stats', async (req, res) => {
    try {
        // Import database service
        const { DatabaseFactory } = await import('./services/DatabaseFactory.js');
        const db = DatabaseFactory.create();
        
        // Get basic stats
        const stats = await db.getStatistics();
        
        res.json({
            status: 'success',
            timestamp: new Date().toISOString(),
            database: 'connected',
            articles: stats.length,
            sources: [...new Set(stats.map(s => s.source))],
            categories: [...new Set(stats.map(s => s.category))]
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🏥 Health check server running on port ${PORT}`);
});

export default app;
