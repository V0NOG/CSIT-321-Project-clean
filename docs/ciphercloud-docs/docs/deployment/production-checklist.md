---
id: production-checklist
title: Production Checklist
sidebar_label: Production Checklist
---

# Production Checklist

Complete every item before exposing Cipher Cloud to real users. Items marked **Critical** are security requirements; leaving them unchecked creates known exploitable vulnerabilities.

---

## Infrastructure

| | Item | Notes |
|-|------|-------|
| ☐ | Server provisioned (Ubuntu 22.04 LTS, 2 vCPU, 2 GB RAM minimum) | |
| ☐ | Node.js 20.x LTS installed | `node --version` |
| ☐ | pnpm installed | `pnpm --version` |
| ☐ | PM2 installed globally | `pm2 --version` |
| ☐ | nginx installed and running | `systemctl status nginx` |
| ☐ | TLS certificate obtained (Let's Encrypt / Certbot) | |
| ☐ | HTTP → HTTPS redirect configured in nginx | |
| ☐ | Firewall: only ports 80, 443, and 22 (SSH) open | `ufw status` |

---

## Environment Variables

| | Item | Notes |
|-|------|-------|
| ☐ | `NODE_ENV=production` | |
| ☐ | `JWT_ACCESS_SECRET` — 64+ byte random hex | Not reused from dev |
| ☐ | `JWT_REFRESH_SECRET` — 64+ byte random hex | Different from access secret |
| ☐ | `TOTP_ENC_KEY` — exactly 32 bytes (64 hex chars) | |
| ☐ | `MONGO_URI` points to Atlas production cluster | |
| ☐ | `COOKIE_SECURE=true` | Requires HTTPS |
| ☐ | `COOKIE_SAME_SITE=strict` | |
| ☐ | `CLIENT_URL` set to production domain (e.g., `https://your-domain.com`) | |
| ☐ | `.env` file not committed to git | |
| ☐ | `.env` file permissions restricted (`chmod 600 .env`) | |

---

## Database

| | Item | Notes |
|-|------|-------|
| ☐ | MongoDB Atlas cluster created | |
| ☐ | Database user with minimum required permissions | Not root/admin role |
| ☐ | Network access restricted to server IP only | Not `0.0.0.0/0` |
| ☐ | TTL index created on `sessions` collection | `{ expiresAt: 1 }, { expireAfterSeconds: 0 }` |
| ☐ | Atlas backup/continuous cloud backup enabled | |

---

## Security — Critical Items

| | Item | Severity | Notes |
|-|------|----------|-------|
| ☐ | Rate limiting added to `/api/auth/login` | **Critical** | `express-rate-limit`: 10 attempts / 15 min / IP |
| ☐ | Rate limiting added to `/api/auth/register` | **Critical** | |
| ☐ | `verifyAdmin` added to `GET /api/settings/oauth` | **Critical** | Currently any user can read OAuth credentials |
| ☐ | `verifyAdmin` added to `PUT /api/settings/oauth` | **Critical** | |
| ☐ | CORS `CLIENT_URL` restricted to production domain only | **High** | Remove `localhost` origins |
| ☐ | Helmet.js `contentSecurityPolicy` tuned for production | **High** | |
| ☐ | All JWT secrets rotated from development values | **Critical** | |

---

## OAuth Configuration

| | Item | Notes |
|-|------|-------|
| ☐ | Dropbox redirect URI updated to production domain | In Dropbox developer portal |
| ☐ | Google Drive redirect URI updated to production domain | In Google Cloud Console |
| ☐ | Google OAuth consent screen published (not in test mode) | Otherwise only test users can sign in |
| ☐ | OAuth credentials saved via `PUT /api/settings/oauth` in production app | |

---

## Frontend Build

| | Item | Notes |
|-|------|-------|
| ☐ | `pnpm build` completed without errors | In `frontend/` directory |
| ☐ | `frontend/dist/` deployed to nginx `root` path | |
| ☐ | `VITE_API_URL` points to production API | |
| ☐ | nginx `try_files $uri $uri/ /index.html` configured | Required for React Router |
| ☐ | nginx `client_max_body_size 500m` set | Required for large file uploads |

---

## Backend / PM2

| | Item | Notes |
|-|------|-------|
| ☐ | Backend started with `pm2 start server.js --name ciphercloud-api --env production` | |
| ☐ | `pm2 save` run | Persists process list |
| ☐ | `pm2 startup` configured | Survives server reboot |
| ☐ | `pm2 logs` show no errors | |

---

## Post-Deploy Smoke Tests

| | Test | Expected Result |
|-|------|----------------|
| ☐ | Navigate to `https://your-domain.com` | Frontend loads; no browser console errors |
| ☐ | Register a new account | Account created successfully |
| ☐ | Sign in | Dashboard shown |
| ☐ | Upload a file | File appears in list |
| ☐ | Download the file | File content matches original |
| ☐ | Enable TOTP | QR code shown; code accepted |
| ☐ | Connect Dropbox | OAuth flow completes; connector listed |
| ☐ | Share a file | Recipient receives invitation |
| ☐ | Accept share and download | File decrypts correctly for recipient |
| ☐ | Check TLS | `https://` shown; certificate valid; no mixed-content warnings |
| ☐ | Check Swagger UI at `/api-docs` | Spec loads correctly |
