---
id: production-deployment
title: Production Deployment
sidebar_label: Production Deployment
---

# Production Deployment

This guide covers deploying Cipher Cloud to a Linux server (Ubuntu 22.04 recommended) with nginx as a reverse proxy and PM2 as the Node.js process manager.

---

## Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Node.js | 20.x LTS | 20.x LTS |

---

## 1. Server Preparation

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2

# Install nginx
sudo apt install -y nginx

# Install Certbot for TLS
sudo apt install -y certbot python3-certbot-nginx
```

---

## 2. Clone and Configure

```bash
# Clone repository
git clone <repo-url> /opt/ciphercloud
cd /opt/ciphercloud

# Install backend dependencies
cd backend && pnpm install

# Install frontend dependencies
cd ../frontend && pnpm install --legacy-peer-deps
```

### Production Backend `.env`

```bash title="/opt/ciphercloud/backend/.env"
PORT=3000
NODE_ENV=production

MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/ciphercloud?retryWrites=true&w=majority

JWT_ACCESS_SECRET=<64-byte-hex>
JWT_REFRESH_SECRET=<64-byte-hex>
TOTP_ENC_KEY=<64-byte-hex>

COOKIE_SECURE=true
COOKIE_SAME_SITE=strict

GOOGLE_CLIENT_ID=<google-client-id>

DROPBOX_APP_KEY=<dropbox-key>
DROPBOX_APP_SECRET=<dropbox-secret>
DROPBOX_REDIRECT_URI=https://your-domain.com/api/connectors/dropbox/callback

GOOGLE_DRIVE_CLIENT_ID=<drive-client-id>
GOOGLE_DRIVE_CLIENT_SECRET=<drive-secret>
GOOGLE_DRIVE_REDIRECT_URI=https://your-domain.com/api/connectors/googledrive/callback

CLIENT_URL=https://your-domain.com
```

### Production Frontend `.env`

```bash title="/opt/ciphercloud/frontend/.env"
VITE_API_URL=https://your-domain.com
VITE_GOOGLE_CLIENT_ID=<google-client-id>
VITE_DROPBOX_APP_KEY=<dropbox-key>
```

---

## 3. Build the Frontend

```bash
cd /opt/ciphercloud/frontend
pnpm build
# Output: frontend/dist/
```

---

## 4. Configure nginx

```nginx title="/etc/nginx/sites-available/ciphercloud"
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers (Helmet adds these from Node, nginx duplicates for the static frontend)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Frontend — serve Vite build output
    location / {
        root /opt/ciphercloud/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Backend API — reverse proxy to Express
    location /api/ {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # Allow large file uploads (match backend 500 MB limit)
        client_max_body_size 500m;
        proxy_read_timeout   300s;
        proxy_send_timeout   300s;
    }

    # Swagger UI
    location /api-docs {
        proxy_pass http://localhost:3000;
    }
}
```

```bash
# Enable site and reload nginx
sudo ln -s /etc/nginx/sites-available/ciphercloud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Obtain TLS Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot automatically renews certificates. Verify with:

```bash
sudo certbot renew --dry-run
```

---

## 6. Start Backend with PM2

```bash
cd /opt/ciphercloud/backend

# Start with PM2
pm2 start server.js --name ciphercloud-api --env production

# Save process list (survives server reboot)
pm2 save

# Configure PM2 to start on boot
pm2 startup
# Run the command it outputs (e.g., sudo env PATH=... pm2 startup systemd ...)
```

### PM2 Commands

| Command | Purpose |
|---------|---------|
| `pm2 status` | List running processes |
| `pm2 logs ciphercloud-api` | Stream live logs |
| `pm2 restart ciphercloud-api` | Restart after code update |
| `pm2 stop ciphercloud-api` | Stop the process |
| `pm2 monit` | Real-time CPU/memory monitor |

---

## 7. Create MongoDB TTL Index

```bash
# In MongoDB Atlas Data Explorer, or via mongosh:
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/ciphercloud"
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

---

## 8. Update OAuth Redirect URIs

Update all redirect URIs in the Dropbox developer portal and Google Cloud Console from `localhost:3000` to `https://your-domain.com`.

---

## Deployment Workflow (Updates)

```bash
cd /opt/ciphercloud

# Pull latest code
git pull

# Rebuild frontend
cd frontend && pnpm build

# Restart backend
pm2 restart ciphercloud-api
```
