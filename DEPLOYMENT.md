# Deployment Guide

## Option 1: Docker Deployment (Recommended)

### Prerequisites
- Docker installed
- Docker Compose installed
- Docker Hub account (optional, for pushing images)

### Steps

1. **Prepare Configuration**
```bash
cd indian-stock-basket
cp backend/.env.example backend/.env
# Edit backend/.env with your configurations
```

2. **Build and Run**
```bash
docker-compose up -d
```

3. **Verify Services**
```bash
docker-compose ps
# Should show 3 services: mongodb, backend, frontend
```

4. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

5. **View Logs**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

6. **Stop Services**
```bash
docker-compose down
```

---

## Option 2: Heroku Deployment

### Prerequisites
- Heroku CLI installed
- Heroku account
- Git repository initialized

### Backend Deployment

1. **Create Heroku App**
```bash
heroku create your-app-name-api
```

2. **Add MongoDB Atlas**
```bash
# Create free MongoDB Atlas cluster at https://www.mongodb.com/cloud/atlas
# Get connection string
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

3. **Set Environment Variables**
```bash
heroku config:set \
  JWT_SECRET=your_secret_key \
  EMAIL_USER=your_email@gmail.com \
  EMAIL_PASSWORD=your_app_password \
  NODE_ENV=production
```

4. **Deploy**
```bash
git subtree push --prefix backend heroku main
# or
cd backend
heroku create your-app-name-api --buildpack heroku/nodejs
git push heroku main
```

### Frontend Deployment

1. **Update API URL in Frontend**
```bash
# Create .env.production
REACT_APP_API_URL=https://your-app-name-api.herokuapp.com/api
```

2. **Deploy Frontend**
```bash
cd frontend
heroku create your-app-name-ui --buildpack heroku/static
git push heroku main
```

---

## Option 3: AWS Deployment

### Using Elastic Beanstalk

1. **Install AWS CLI**
```bash
pip install awsebcli
```

2. **Initialize EB Project**
```bash
eb init -p node.js-18 indian-stock-basket --region us-east-1
```

3. **Create Environment**
```bash
eb create production-env
```

4. **Set Environment Variables**
```bash
eb setenv \
  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db \
  JWT_SECRET=your_secret_key \
  EMAIL_USER=your_email@gmail.com
```

5. **Deploy**
```bash
eb deploy
```

---

## Option 4: Render Deployment

### Backend

1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repository
4. Configuration:
   - Build Command: `npm install && npm run init-db`
   - Start Command: `npm start`
   - Environment: Node
   - Plan: Free

5. Add Environment Variables:
   - MONGODB_URI
   - EMAIL_USER
   - EMAIL_PASSWORD
   - JWT_SECRET

### Frontend

1. Create new Static Site
2. Connect GitHub repository
3. Configuration:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

---

## Option 5: DigitalOcean Deployment

### Create Droplet

1. Create Ubuntu 22.04 LTS Droplet
2. SSH into droplet

### Setup Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Deploy Application

```bash
# Clone repository
cd /var/www
git clone <repository-url>
cd indian-stock-basket

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with configurations
pm2 start server.js --name "stock-basket-api"

# Frontend setup
cd ../frontend
npm install
npm run build
# Configure Nginx to serve frontend
```

### Configure Nginx

Create `/etc/nginx/sites-available/stock-basket`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        alias /var/www/indian-stock-basket/frontend/build/;
        try_files $uri /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/stock-basket /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Production Checklist

- [ ] Use strong JWT_SECRET
- [ ] Configure MongoDB Atlas with proper authentication
- [ ] Setup HTTPS/SSL certificates
- [ ] Enable CORS for your domain only
- [ ] Set NODE_ENV=production
- [ ] Configure database backups
- [ ] Setup monitoring and alerts
- [ ] Enable rate limiting
- [ ] Setup error tracking (Sentry)
- [ ] Configure CDN for static assets
- [ ] Setup auto-scaling
- [ ] Monitor logs and performance
- [ ] Regular security updates

## Database Migration

### From Local to MongoDB Atlas

1. **Export data from local MongoDB:**
```bash
mongodump --db indian-stock-basket --out ./backup
```

2. **Create MongoDB Atlas cluster:**
   - Go to mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string

3. **Update .env:**
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/indian-stock-basket
```

4. **Restore in production:**
```bash
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net" ./backup
```

## Monitoring & Maintenance

### Health Checks
```bash
curl https://your-domain.com/health
```

### Log Monitoring
- Check application logs regularly
- Setup centralized logging (ELK Stack, DataDog)
- Monitor database performance

### Backups
- Daily automated backups
- Test restore procedures
- Keep 30-day retention

### Updates
- Keep dependencies updated
- Security patches
- MongoDB updates

## Performance Optimization

1. **Database Indexes**
```javascript
// Add indexes in backend
basket.collection.createIndex({ subscribers: 1 })
stock.collection.createIndex({ ticker: 1 })
```

2. **Caching**
- Use Redis for stock data cache
- Cache API responses

3. **CDN**
- Use CloudFlare for frontend
- Cache static assets

4. **Load Balancing**
- Use load balancer for multiple backend instances
- Horizontal scaling

## Rollback Procedure

```bash
# If deployment fails
git log --oneline
git revert <commit-hash>
git push

# Or rollback to previous version
docker-compose down
git checkout previous-version
docker-compose up -d
```

## Cost Optimization

- **Free Tier Services:**
  - MongoDB Atlas (512MB free)
  - Render (1 free instance)
  - GitHub (free private repos)
  - CloudFlare (free CDN)

- **Budget Services:**
  - DigitalOcean: $5/month droplet
  - Heroku: $7/month (eco dynos)
  - AWS EC2: ~$10/month (free tier eligible)

## Support & Troubleshooting

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connection
4. Check API endpoints
5. Monitor error tracking

---

Your application is now ready for production! 🚀
