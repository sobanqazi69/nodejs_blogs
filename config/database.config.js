/**
 * Database Configuration
 * Choose between SQLite (default) or MySQL (XAMPP)
 */

// Database type: 'sqlite' or 'mysql'
export const DATABASE_TYPE = 'mysql'; // Using MySQL for cPanel hosting

// SQLite configuration (default)
export const sqliteConfig = {
    database: 'news.db',
    path: './news.db'
};

// MySQL configuration (for cPanel hosting)
export const mysqlConfig = {
    host: 'firewalls247.com', // Your cPanel database host
    user: 'infors3g', // Your cPanel username
    password: 'wjjSLu5g$pQf3f&tmXcjKdwg765tq2', // Your cPanel password
    database: 'infors3g_testst', // Your database name
    port: 3306 // Working port
};

// Get current database configuration
export function getDatabaseConfig() {
    if (DATABASE_TYPE === 'mysql') {
        return {
            type: 'mysql',
            config: mysqlConfig
        };
    } else {
        return {
            type: 'sqlite',
            config: sqliteConfig
        };
    }
}
