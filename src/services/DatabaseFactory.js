import { DatabaseService } from './DatabaseService.js';
import { MySQLDatabaseService } from './MySQLDatabaseService.js';
import { getDatabaseConfig } from '../../config/database.config.js';

/**
 * Database Factory - Creates appropriate database service
 */
export class DatabaseFactory {
    /**
     * Create database service based on configuration
     */
    static create() {
        const dbConfig = getDatabaseConfig();
        
        if (dbConfig.type === 'mysql') {
            console.log('🔧 Using MySQL database (XAMPP)');
            return new MySQLDatabaseService();
        } else {
            console.log('🔧 Using SQLite database (local file)');
            return new DatabaseService();
        }
    }
}
