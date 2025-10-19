# XAMPP Setup Guide for News Database

## Option 1: Use SQLite (Recommended - No XAMPP needed)

The current setup uses SQLite which creates a local `news.db` file. No XAMPP required!

**To view SQLite database:**
1. Download SQLite Browser: https://sqlitebrowser.org/
2. Open `news.db` file in your project directory
3. Browse tables: `articles`, `categories`, `sources`

## Option 2: Use MySQL with XAMPP

### Step 1: Install and Start XAMPP

1. Download XAMPP from: https://www.apachefriends.org/
2. Install XAMPP
3. Start XAMPP Control Panel
4. Start **Apache** and **MySQL** services

### Step 2: Create Database

1. Open browser and go to: http://localhost/phpmyadmin
2. Click "New" to create a new database
3. Database name: `news_db`
4. Collation: `utf8mb4_general_ci`
5. Click "Create"

### Step 3: Configure Application

1. Open `config/database.config.js`
2. Change `DATABASE_TYPE` from `'sqlite'` to `'mysql'`:

```javascript
export const DATABASE_TYPE = 'mysql'; // Change this line
```

### Step 4: Install MySQL Dependencies

```bash
npm install
```

### Step 5: Run Application

```bash
npm start
```

## Database Access Methods

### Method 1: phpMyAdmin (Web Interface)
- URL: http://localhost/phpmyadmin
- Database: `news_db`
- Tables: `articles`, `categories`, `sources`

### Method 2: MySQL Command Line
```bash
# Connect to MySQL
mysql -u root -p

# Use database
USE news_db;

# View articles
SELECT * FROM articles LIMIT 10;

# View by category
SELECT * FROM articles WHERE category = 'international' LIMIT 5;

# Search articles
SELECT * FROM articles WHERE title LIKE '%trump%';
```

### Method 3: Database CLI
```bash
# View statistics
npm run db:stats

# View by category
npm run db:category international 10

# Search articles
npm run db:search "trump" 20
```

## Database Schema

### Articles Table
```sql
CREATE TABLE articles (
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
);
```

### Categories Table
```sql
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sources Table
```sql
CREATE TABLE sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    url VARCHAR(500),
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### XAMPP MySQL Won't Start
1. Check if port 3306 is already in use
2. Stop other MySQL services
3. Restart XAMPP

### Connection Refused
1. Make sure MySQL is running in XAMPP
2. Check if port 3306 is accessible
3. Verify database name exists

### Permission Denied
1. Check MySQL user permissions
2. Default XAMPP user: `root` with no password
3. Update `config/database.config.js` if needed
