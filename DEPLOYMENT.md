# Sudoku Arena - Production Deployment Guide

## Overview
This guide covers deploying the Sudoku Arena multiplayer platform to production with full real-time capabilities, payment integration, and database setup.

## Architecture
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Custom Node.js server with Socket.IO for real-time multiplayer
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with email/password and OAuth providers
- **Payments**: Razorpay integration for wallet management
- **Real-time**: Socket.IO for multiplayer game sessions

## Production Deployment Steps

### 1. Environment Setup

Create a production `.env.local` file:

```bash
# Database - Supabase Production
DATABASE_URL="your_production_supabase_connection_string"
DIRECT_URL="your_production_supabase_direct_url"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your_secure_nextauth_secret"

# OAuth Providers (Production Keys)
GOOGLE_CLIENT_ID="your_production_google_client_id"
GOOGLE_CLIENT_SECRET="your_production_google_client_secret"
GITHUB_CLIENT_ID="your_production_github_client_id"
GITHUB_CLIENT_SECRET="your_production_github_client_secret"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your_production_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_production_supabase_anon_key"

# Razorpay Production Keys
RAZORPAY_KEY_ID="your_production_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_production_razorpay_key_secret"

# Optional: Email configuration for notifications
SMTP_HOST="your_smtp_host"
SMTP_PORT="587"
SMTP_USER="your_smtp_user"
SMTP_PASS="your_smtp_password"
```

### 2. Database Migration

```bash
# Generate Prisma client for production
npx prisma generate

# Deploy database schema to production
npx prisma db push

# Optional: Seed initial data
npx prisma db seed
```

### 3. Vercel Deployment (Recommended)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Configure vercel.json**:
```json
{
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "next.config.js",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/socket.io/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. **Deploy**:
```bash
vercel --prod
```

### 4. Alternative: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  sudoku-arena:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.local
```

Deploy:
```bash
docker-compose up -d
```

### 5. AWS/DigitalOcean Deployment

1. **Setup server instance**
2. **Install Node.js and PM2**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2
```

3. **Clone and setup**:
```bash
git clone your-repo-url
cd sudoku-arena
npm install
npm run build
```

4. **Create PM2 ecosystem file** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'sudoku-arena',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

5. **Start with PM2**:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

6. **Setup Nginx reverse proxy**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO specific configuration
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. Production Considerations

#### Performance Optimization
- Enable Redis for Socket.IO clustering
- Implement CDN for static assets
- Add database connection pooling
- Enable gzip compression
- Implement rate limiting

#### Security
- Enable HTTPS/SSL certificates (Let's Encrypt)
- Implement CORS policies
- Add request validation middleware
- Enable security headers
- Implement API rate limiting

#### Monitoring
- Setup application monitoring (DataDog, New Relic)
- Implement error tracking (Sentry)
- Add performance monitoring
- Setup uptime monitoring
- Configure log aggregation

#### Scaling
- Implement Redis adapter for Socket.IO clustering
- Setup horizontal scaling with load balancer
- Add database read replicas
- Implement caching strategy
- Setup CDN for global performance

### 7. Post-Deployment Checklist

- [ ] Verify database connectivity
- [ ] Test authentication flows
- [ ] Verify Socket.IO real-time functionality
- [ ] Test payment integration
- [ ] Check email notifications
- [ ] Verify SSL/HTTPS configuration
- [ ] Test mobile responsiveness
- [ ] Run security scans
- [ ] Setup monitoring and alerts
- [ ] Configure backup strategy

### 8. Maintenance

#### Regular Tasks
- Monitor application performance
- Update dependencies regularly
- Backup database weekly
- Review security logs
- Monitor payment transactions
- Update SSL certificates

#### Scaling Indicators
- High CPU/Memory usage
- Slow database queries
- Socket.IO connection limits
- Payment processing delays
- User growth metrics

## Support

For deployment issues or questions:
- Check server logs: `pm2 logs sudoku-arena`
- Database issues: Check Supabase dashboard
- Payment issues: Check Razorpay dashboard
- Real-time issues: Check Socket.IO connection logs

## License
MIT License - see LICENSE file for details.
