/**
 * Database Configuration
 * Choose between SQLite (default) or MySQL (XAMPP)
 */

// Database type: 'sqlite' or 'mysql'
export const DATABASE_TYPE = 'mysql'; // Using MySQL with XAMPP

// SQLite configuration (default)
export const sqliteConfig = {
    database: 'news.db',
    path: './news.db'
};

// MySQL configuration (for XAMPP) - Using your existing 'blog' database
export const mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Default XAMPP password is empty
    database: 'blog', // Using your existing database
    port: 3306
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
