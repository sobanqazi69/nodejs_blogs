# cPanel Deployment Guide

## Prerequisites
- cPanel hosting account with Node.js support
- MySQL database access
- Cron job functionality

## Step 1: Prepare Files for Upload

### Create deployment package:
```bash
# Create deployment folder
mkdir cpanel-deploy
cd cpanel-deploy

# Copy project files (excluding node_modules)
cp -r src/ .
cp package.json .
cp .gitignore .

# Create production package.json
```

## Step 2: Database Setup

### In cPanel MySQL:
1. Create database: `your_username_newsdb`
2. Create user: `your_username_newsuser`
3. Grant privileges to user on database
4. Note down database credentials

## Step 3: Environment Configuration

### Create `.env` file in cPanel:
```env
# Database Configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=your_username_newsuser
DB_PASSWORD=your_password
DB_NAME=your_username_newsdb
DB_PORT=3306

# Scraper Configuration
SCRAPE_INTERVAL_MINUTES=5
MAX_ARTICLES_PER_SCRAPE=0
ENABLE_STATUS_UPDATES=true
LOG_LEVEL=info
```

## Step 4: Upload Files

### Via cPanel File Manager:
1. Upload all files to your domain's public_html or subdirectory
2. Set proper permissions (755 for directories, 644 for files)
3. Make sure Node.js is enabled in cPanel

## Step 5: Install Dependencies

### Via cPanel Terminal (if available):
```bash
cd /home/your_username/public_html/your_project
npm install --production
```

## Step 6: Setup Cron Job

### In cPanel Cron Jobs:
1. Go to "Cron Jobs" in cPanel
2. Add new cron job:
   - **Minute**: `*/5` (every 5 minutes)
   - **Hour**: `*`
   - **Day**: `*`
   - **Month**: `*`
   - **Weekday**: `*`
   - **Command**: `cd /home/your_username/public_html/your_project && node src/continuous-app.js`

### Alternative: One-time setup script
```bash
# Create setup script
echo '#!/bin/bash
cd /home/your_username/public_html/your_project
node src/continuous-app.js' > run_scraper.sh

chmod +x run_scraper.sh
```

## Step 7: Database Initialization

### Create init script:
```bash
# Create database initialization script
node src/database-cli.js init
```

## Step 8: Monitoring

### Check logs:
```bash
# View application logs
tail -f /home/your_username/public_html/your_project/logs/app.log

# Check cron job logs
tail -f /var/log/cron
```

## Step 9: Web Interface (Optional)

### Create simple web interface to view articles:
```javascript
// public/index.html
<!DOCTYPE html>
<html>
<head>
    <title>News Scraper Dashboard</title>
</head>
<body>
    <h1>News Scraper Dashboard</h1>
    <p>Scraper is running in background</p>
    <p>Check database for latest articles</p>
</body>
</html>
```

## Troubleshooting

### Common Issues:
1. **Node.js not found**: Enable Node.js in cPanel
2. **Database connection failed**: Check database credentials
3. **Cron job not running**: Check cron job syntax and permissions
4. **Memory issues**: Optimize scraper for shared hosting

### Debug Commands:
```bash
# Test database connection
node src/database-cli.js stats

# Test single scrape
node src/app.js

# Check Node.js version
node --version
npm --version
```

## Security Considerations

1. **Environment Variables**: Never commit .env file
2. **Database Security**: Use strong passwords
3. **File Permissions**: Set appropriate permissions
4. **Cron Job Security**: Limit cron job access

## Performance Optimization

1. **Memory Usage**: Monitor memory consumption
2. **Database Indexing**: Add indexes for better performance
3. **Error Handling**: Implement proper error handling
4. **Log Rotation**: Implement log rotation for large logs
