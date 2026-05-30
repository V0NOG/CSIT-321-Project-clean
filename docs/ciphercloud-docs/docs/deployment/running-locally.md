---
id: running-locally
title: Running Locally
sidebar_label: Running Locally
---

# Running Locally

This page covers running the full development stack on your machine after completing [Backend Setup](backend-setup), [Frontend Setup](frontend-setup), and [Database Setup](database-setup).

---

## Start the Backend

```bash
cd backend
pnpm dev
```

Expected output:

```
[nodemon] starting `node server.js`
MongoDB connected
Server running on port 3000
```

The backend API is now available at `http://localhost:3000`.  
Swagger UI is at `http://localhost:3000/api-docs`.

---

## Start the Frontend

Open a second terminal:

```bash
cd frontend
pnpm dev
```

Expected output:

```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://xxx.xxx.xxx.xxx:5173/
```

The frontend is now available at `http://localhost:5173`.

---

## First-Run Checklist

| Step | Verification |
|------|-------------|
| Backend running | `curl http://localhost:3000/api-docs` returns HTML |
| Frontend running | Browser opens `http://localhost:5173` without errors |
| MongoDB connected | Backend console shows `MongoDB connected` |
| Registration works | Create an account via the Sign Up page |
| Login works | Sign in returns to the dashboard |
| File upload works | Upload a test file — it appears in the file list |
| File download works | Download the file — content matches original |

---

## Running Both Servers Concurrently

If you want a single terminal, use a process manager like `concurrently`:

```bash
# From project root
npm install -g concurrently

concurrently \
  "cd backend && pnpm dev" \
  "cd frontend && pnpm dev"
```

Or use two separate terminal tabs — there is no strict requirement for `concurrently`.

---

## Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Frontend (Vite alt) | 5174 | http://localhost:5174 (if 5173 is in use) |
| Backend (Express) | 3000 | http://localhost:3000 |
| Swagger UI | 3000 | http://localhost:3000/api-docs |
| MongoDB (local) | 27017 | mongodb://localhost:27017/ciphercloud |

---

## Hot Reload Behaviour

| Server | Behaviour |
|--------|-----------|
| Frontend | Vite HMR — TypeScript/TSX changes reload instantly in browser |
| Backend | nodemon — restarts on any `.js` file change in `backend/` |

---

## Common First-Run Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ECONNREFUSED localhost:27017` | Local MongoDB not running | `brew services start mongodb-community` or use Atlas URI |
| `MongoServerError: bad auth` | Wrong Atlas password | Re-check `MONGO_URI` in `backend/.env` |
| Blank white page in browser | Missing `VITE_API_URL` | Add `VITE_API_URL=http://localhost:3000` to `frontend/.env` |
| CORS error in browser console | Backend `CLIENT_URL` mismatch | Set `CLIENT_URL=http://localhost:5173` in `backend/.env` |
| `pnpm: command not found` | pnpm not installed | `npm install -g pnpm` |
