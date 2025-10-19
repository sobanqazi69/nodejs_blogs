# Railway Deployment Guide

## 🚀 Deploy Your News Scraper to Railway

### Prerequisites
- GitHub account
- Railway account (free tier available)
- Your news scraper code

## Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: News scraper with Railway support"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/news-scraper.git
git push -u origin main
```

### 1.2 Verify Files
Make sure these files are in your repository:
- `railway.json` ✅
- `Procfile` ✅
- `package.json` ✅
- `src/railway-app.js` ✅
- `src/health.js` ✅

## Step 2: Deploy to Railway

### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your GitHub account

### 2.2 Deploy Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your news scraper repository
4. Railway will automatically detect it's a Node.js project

### 2.3 Configure Environment Variables
In Railway dashboard, go to your project → Variables tab:

```env
# Database Configuration
DATABASE_TYPE=sqlite
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=news.db
DB_PORT=3306

# Scraper Configuration
SCRAPE_INTERVAL_MINUTES=5
MAX_ARTICLES_PER_SCRAPE=0
ENABLE_STATUS_UPDATES=true
LOG_LEVEL=info
NODE_ENV=production

# Optional: Custom settings
SHOW_NEW_ARTICLES=true
SHOW_SCRAPE_PROGRESS=true
```

## Step 3: Database Setup

### Option A: SQLite (Recommended for Railway)
- No additional setup needed
- Database file will be created automatically
- Perfect for free tier

### Option B: MySQL (If you want external database)
1. Add MySQL service in Railway
2. Update environment variables with MySQL credentials
3. Change `DATABASE_TYPE=mysql`

## Step 4: Configure Cron Job

### 4.1 Railway Cron Jobs
Railway doesn't have traditional cron jobs, but the app runs continuously:

1. **Continuous Mode**: The app runs 24/7 and scrapes every 5 minutes
2. **Health Checks**: Railway monitors the app via `/health` endpoint
3. **Auto-restart**: Railway restarts the app if it crashes

### 4.2 Alternative: External Cron Service
If you want to use external cron service:

1. **Cron-job.org**: Free cron service
2. **Set URL**: `https://your-app.railway.app/health`
3. **Interval**: Every 5 minutes
4. **Purpose**: Keep app alive and trigger scrapes

## Step 5: Monitor Your Deployment

### 5.1 Railway Dashboard
- **Deployments**: View deployment history
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, network usage
- **Variables**: Environment variables

### 5.2 Health Check Endpoints
Your app will be available at: `https://your-app.railway.app`

- **Health Check**: `https://your-app.railway.app/health`
- **Stats**: `https://your-app.railway.app/stats`
- **Home**: `https://your-app.railway.app/`

### 5.3 View Logs
```bash
# In Railway dashboard, go to Deployments → View Logs
# Or use Railway CLI:
railway logs
```

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain
1. Go to your project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### 6.2 SSL Certificate
- Railway provides free SSL certificates
- Automatic HTTPS for all domains

## Step 7: Scaling and Optimization

### 7.1 Free Tier Limits
- **Build Time**: 500 minutes/month
- **Deploy Time**: 100 hours/month
- **Sleep**: App sleeps after 5 minutes of inactivity
- **Wake Time**: ~30 seconds to wake up

### 7.2 Pro Tier Benefits
- **Always On**: No sleep mode
- **More Resources**: Higher CPU/memory limits
- **Custom Domains**: Multiple domains
- **Team Collaboration**: Multiple team members

## Step 8: Troubleshooting

### 8.1 Common Issues

#### App Not Starting
```bash
# Check logs in Railway dashboard
# Common causes:
# - Missing dependencies
# - Wrong start command
# - Environment variables not set
```

#### Database Connection Issues
```bash
# For SQLite: Check file permissions
# For MySQL: Verify connection string
# Check environment variables
```

#### Memory Issues
```bash
# Monitor memory usage in Railway dashboard
# Optimize scraper for lower memory usage
# Consider upgrading to Pro tier
```

### 8.2 Debug Commands
```bash
# Test locally with Railway environment
npm run railway

# Check health endpoint
curl https://your-app.railway.app/health

# View application logs
railway logs --follow
```

## Step 9: Advanced Configuration

### 9.1 Custom Build Process
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  }
}
```

### 9.2 Multiple Services
```json
// railway.json
{
  "services": [
    {
      "name": "web",
      "source": ".",
      "build": { "builder": "NIXPACKS" }
    },
    {
      "name": "scraper",
      "source": ".",
      "build": { "builder": "NIXPACKS" }
    }
  ]
}
```

## Step 10: Monitoring and Alerts

### 10.1 Railway Monitoring
- **Uptime**: Automatic monitoring
- **Alerts**: Email notifications for failures
- **Metrics**: CPU, memory, network graphs

### 10.2 External Monitoring
- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Advanced monitoring
- **StatusCake**: Simple uptime checks

## 🎉 Success!

Your news scraper is now running on Railway:
- ✅ **Continuous scraping** every 5 minutes
- ✅ **Health checks** for monitoring
- ✅ **Automatic restarts** on failure
- ✅ **Free hosting** with Railway
- ✅ **Database storage** for articles
- ✅ **Duplicate prevention** built-in

### Next Steps:
1. Monitor your app in Railway dashboard
2. Check logs for any issues
3. Visit your app URL to see health status
4. Set up external monitoring if needed
5. Consider upgrading to Pro tier for production use
