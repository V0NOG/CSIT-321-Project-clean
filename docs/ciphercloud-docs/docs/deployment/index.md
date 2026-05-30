---
id: index
title: Deployment Overview
sidebar_label: Overview
---

# Deployment Overview

This guide covers everything needed to run Cipher Cloud from a local development environment to a production deployment with nginx and PM2.

---

## Architecture Summary

```
Browser  ──HTTPS──►  Frontend (Vite/nginx)
Browser  ──HTTPS──►  Backend (Node.js / Express 5)
                          │
                          ├──TLS──► MongoDB Atlas
                          ├──HTTPS► Dropbox API
                          └──HTTPS► Google Drive API
```

All file content is encrypted in the browser before leaving the client. The backend stores only ciphertext blobs, wrapped keys, and metadata.

---

## Prerequisites

### Software

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20 LTS | Required for both backend and frontend build |
| pnpm | 10.x | Project package manager `npm install -g pnpm` |
| MongoDB | Atlas (cloud) or 7 local | See [Database Setup](database-setup) |
| Git | Any | For cloning the repository |

### Accounts (for cloud features)

| Service | Required | Purpose |
|---------|----------|---------|
| MongoDB Atlas | Yes | Database hosting (free tier available) |
| Dropbox Developer App | Optional | Dropbox storage connector |
| Google Cloud Project | Optional | Google Drive connector + Google OAuth sign-in |

---

## Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone <repo-url>
cd CSIT-321-Project-clean

# 2. Install backend dependencies
cd backend
pnpm install

# 3. Configure backend environment
cp .env.example .env
# Edit .env with your values (see Backend Setup)

# 4. Install frontend dependencies
cd ../frontend
pnpm install --legacy-peer-deps

# 5. Start both servers
cd ../backend && pnpm dev &
cd ../frontend && pnpm dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:3000`  
Swagger UI: `http://localhost:3000/api-docs`

---

## Section Map

| Section | What it covers |
|---------|---------------|
| [Backend Setup](backend-setup) | Dependencies, `.env` variables, startup commands |
| [Frontend Setup](frontend-setup) | Dependencies, Vite env vars, build output |
| [Database Setup](database-setup) | MongoDB Atlas configuration, local MongoDB |
| [Cloud Connectors](cloud-connectors) | Dropbox and Google Drive developer app setup |
| [Running Locally](running-locally) | Running both servers in development mode |
| [Production Deployment](production-deployment) | nginx, PM2, SSL, environment hardening |
| [Production Checklist](production-checklist) | Go-live verification checklist |
| [Troubleshooting](troubleshooting) | Common errors and fixes |
