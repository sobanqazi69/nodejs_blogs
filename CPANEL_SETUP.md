# cPanel MySQL Database Setup Guide

## Step 1: Create MySQL Database in cPanel

1. **Login to your cPanel**
2. **Navigate to "MySQL Databases"**
3. **Create New Database:**
   - Database Name: `news_scraper` (or any name you prefer)
   - Click "Create Database"

4. **Create New User:**
   - Username: `news_user` (or any username you prefer)
   - Password: Create a strong password
   - Click "Create User"

5. **Add User to Database:**
   - Select the user and database
   - Click "Add"
   - Grant "ALL PRIVILEGES"
   - Click "Make Changes"

## Step 2: Get Database Connection Details

From your cPanel, note down:
- **Database Host:** Usually `localhost` or your server's IP
- **Database Name:** The name you created (e.g., `news_scraper`)
- **Username:** The username you created (e.g., `news_user`)
- **Password:** The password you set
- **Port:** Usually `3306`

## Step 3: Update Configuration

Edit `config/database.config.js` and replace the placeholder values:

```javascript
export const mysqlConfig = {
    host: 'your_actual_host',        // e.g., 'localhost'
    user: 'your_actual_username',    // e.g., 'news_user'
    password: 'your_actual_password', // e.g., 'your_strong_password'
    database: 'your_actual_database', // e.g., 'news_scraper'
    port: 3306
};
```

## Step 4: Test Connection

Run the database initialization:
```bash
npm run db:init
```

This will create the necessary tables in your MySQL database.

## Step 5: Start Scraping

Run the continuous scraper:
```bash
npm start
```

## Database Tables Created

The scraper will automatically create these tables:
- `articles` - Stores all news articles
- `categories` - Stores article categories
- `sources` - Stores news sources

## Troubleshooting

- **Connection Error:** Check your database credentials
- **Permission Error:** Ensure the user has ALL PRIVILEGES on the database
- **Host Error:** Try using your server's IP instead of 'localhost'
