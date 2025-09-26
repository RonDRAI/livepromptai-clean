# 🚀 Deployment Guide

Complete deployment instructions for Voice-Enhanced LivePromptAI

## 📋 Prerequisites

### System Requirements
- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **PostgreSQL** 12 or higher
- **Git** for version control

### Accounts Needed
- **Vercel** account (for frontend deployment)
- **Railway** account (for backend + database)
- **Domain registrar** (optional, for custom domain)

## 🏠 Local Development Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone <your-repository-url>
cd livepromptai-handoff

# Install dependencies
npm install
cd server && npm install && cd ..
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb -h localhost livepromptai

# Setup database schema and seed data
npm run db:setup
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required Environment Variables:**
```env
# Database
PGUSER=postgres
PGPASSWORD=your_password
PGHOST=localhost
PGPORT=5432
PGDATABASE=livepromptai

# Server
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

### 4. Start Development Servers
```bash
# Terminal 1: Frontend (localhost:3000)
npm run dev

# Terminal 2: Backend (localhost:3001)
npm run server:dev
```

### 5. Verify Setup
- Visit `http://localhost:3000` - Frontend should load
- Visit `http://localhost:3001/health` - Should return `{"status": "healthy"}`
- Test voice recognition by clicking the microphone button

## ☁️ Production Deployment

## Option 1: Vercel + Railway (Recommended)

### Frontend Deployment (Vercel)

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login and Deploy
```bash
# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name: livepromptai-frontend
# - Directory: ./
# - Override settings? No
```

#### 3. Configure Environment Variables
In Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following:

```env
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
NEXT_PUBLIC_FRONTEND_URL=https://your-vercel-app.vercel.app
```

#### 4. Deploy to Production
```bash
vercel --prod
```

### Backend Deployment (Railway)

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. Login and Initialize
```bash
# Login to Railway
railway login

# Initialize project
railway init

# Select "Empty Project"
# Enter project name: livepromptai-backend
```

#### 3. Add PostgreSQL Database
```bash
# Add PostgreSQL service
railway add postgresql

# This automatically creates database and sets environment variables
```

#### 4. Configure Environment Variables
```bash
# Set environment variables
railway variables set JWT_SECRET=your-super-secret-jwt-key-change-this
railway variables set NODE_ENV=production
railway variables set FRONTEND_URL=https://your-vercel-app.vercel.app
```

#### 5. Deploy Backend
```bash
# Deploy server directory
cd server
railway up
```

#### 6. Setup Database Schema
```bash
# Connect to Railway database and run setup
railway connect postgresql
# In PostgreSQL prompt:
\i ../database/schema.sql
\i ../database/seed.sql
\q
```

### Final Configuration

#### 1. Update Frontend Environment
Update Vercel environment variables with your Railway backend URL:
```env
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
```

#### 2. Update Backend CORS
In Railway, set the FRONTEND_URL to your Vercel domain:
```env
FRONTEND_URL=https://your-vercel-app.vercel.app
```

#### 3. Test Production Deployment
- Visit your Vercel URL
- Test voice recognition functionality
- Verify API connectivity
- Check database operations

## 🔧 Environment Variables Reference

### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend-url.com

# Feature Flags
NEXT_PUBLIC_ENABLE_VOICE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_DEBUG_MODE=false

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=1234567
```

### Backend (.env)
```env
# Database
PGUSER=postgres
PGPASSWORD=your_secure_password
PGHOST=your_db_host
PGPORT=5432
PGDATABASE=livepromptai

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://your-frontend-url.com
CORS_CREDENTIALS=true

# Optional Integrations
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
REDIS_URL=redis://your-redis-url

# Monitoring
LOG_LEVEL=info
ANALYTICS_ENABLED=true
```

## 🔒 Security Checklist

### Pre-Deployment Security
- [ ] Change all default passwords and secrets
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Validate all user inputs
- [ ] Use parameterized database queries

### Post-Deployment Security
- [ ] Monitor application logs
- [ ] Set up error tracking (Sentry)
- [ ] Configure backup strategies
- [ ] Implement health checks
- [ ] Set up monitoring alerts
- [ ] Regular security updates

## 📊 Monitoring & Analytics

### Application Monitoring
```bash
# Add monitoring services
npm install @sentry/nextjs @sentry/node

# Configure error tracking
# Add to next.config.js and server/index.js
```

### Database Monitoring
```sql
-- Create monitoring views
CREATE VIEW system_health AS
SELECT 
  'conversations' as table_name,
  COUNT(*) as record_count,
  MAX(updated_at) as last_activity
FROM conversations
UNION ALL
SELECT 
  'messages' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as last_activity
FROM messages;
```

### Performance Monitoring
- **Frontend**: Vercel Analytics, Web Vitals
- **Backend**: Railway metrics, custom health endpoints
- **Database**: Query performance, connection pooling

## 🚨 Troubleshooting

### Common Deployment Issues

#### Frontend Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check TypeScript errors
npm run type-check

# Verify environment variables
echo $NEXT_PUBLIC_API_URL
```

#### Backend Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check server logs
railway logs

# Verify environment variables
railway variables
```

#### Voice Recognition Not Working
- Ensure HTTPS is enabled (required for Web Speech API)
- Check browser compatibility (Chrome/Edge recommended)
- Verify microphone permissions
- Test in incognito mode to rule out extensions

#### Database Migration Issues
```bash
# Reset database (CAUTION: This deletes all data)
railway connect postgresql
DROP DATABASE livepromptai;
CREATE DATABASE livepromptai;
\q

# Re-run setup
npm run db:setup
```

### Performance Issues

#### Slow API Responses
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_messages_conversation_created 
ON messages(conversation_id, created_at);
```

#### High Memory Usage
```bash
# Monitor memory usage
railway logs --tail

# Optimize database connections
# Reduce connection pool size in production
```

## 📈 Scaling Considerations

### Horizontal Scaling
- **Frontend**: Vercel automatically scales
- **Backend**: Railway auto-scaling or manual scaling
- **Database**: Read replicas, connection pooling

### Performance Optimization
- **CDN**: Cloudflare for static assets
- **Caching**: Redis for session storage
- **Database**: Query optimization, indexing

### Cost Optimization
- **Vercel**: Monitor bandwidth usage
- **Railway**: Right-size resources
- **Database**: Optimize queries, archive old data

## 📞 Support

### Getting Help
- **Documentation**: Check README.md and this guide
- **Issues**: Create GitHub issues for bugs
- **Community**: Join our Discord/Slack community
- **Enterprise**: Contact support for enterprise deployments

### Maintenance
- **Updates**: Regular dependency updates
- **Backups**: Automated database backups
- **Monitoring**: 24/7 uptime monitoring
- **Security**: Regular security audits

---

**🎉 Congratulations!** Your Voice-Enhanced LivePromptAI is now deployed and ready for production use.

For additional support or custom deployment needs, please contact the development team.
