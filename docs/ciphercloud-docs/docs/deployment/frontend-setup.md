---
id: frontend-setup
title: Frontend Setup
sidebar_label: Frontend Setup
---

# Frontend Setup

## Install Dependencies

```bash
cd frontend
pnpm install --legacy-peer-deps
```

:::note --legacy-peer-deps
The `--legacy-peer-deps` flag is required because some packages in the dependency tree have peer dependency constraints that conflict with React 19. This flag instructs pnpm to use the pre-v7 npm peer resolution strategy, which is safe for this project.
:::

---

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash title="frontend/.env"
# Backend API base URL
VITE_API_URL=http://localhost:3000

# Google OAuth client ID (same as backend GOOGLE_CLIENT_ID)
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>

# Dropbox OAuth App Key (same as backend DROPBOX_APP_KEY)
VITE_DROPBOX_APP_KEY=<your-dropbox-app-key>
```

All variables must be prefixed with `VITE_` to be exposed to the browser bundle by Vite. Variables without this prefix remain server-only and are not included in the build output.

---

## Key Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.x | UI framework |
| `typescript` | 5.7 | Type safety |
| `vite` | 6.x | Build tool and dev server |
| `tailwindcss` | 4.x | Utility-first CSS |
| `react-router-dom` | 7.x | Client-side routing |
| `axios` | 1.x | HTTP client |
| `react-dnd` + `react-dnd-html5-backend` | 16.x | Drag-and-drop for Explorer |
| `react-dropzone` | 14.x | Drop zone for file upload |
| `apexcharts` + `react-apexcharts` | 3.x | Analytics charts |
| `lucide-react` | 0.4x | Icon library |

---

## Development Server

```bash
cd frontend
pnpm dev
```

Frontend dev server: [http://localhost:5173](http://localhost:5173)

Hot Module Replacement (HMR) is enabled — file saves reload the browser automatically.

---

## Production Build

```bash
cd frontend
pnpm build
```

Output is written to `frontend/dist/`. This directory contains the static files to be served by nginx or a CDN.

```bash
# Preview the production build locally
pnpm preview
# Available at: http://localhost:4173
```

---

## TypeScript Type Checking

```bash
cd frontend
pnpm tsc --noEmit
```

This checks types without producing output. Fix all type errors before deploying to production.

---

## Route Configuration Note

The frontend uses client-side routing (React Router). When served via nginx, all paths must return `index.html` so the SPA router handles navigation:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Without this, a direct URL like `/explorer` will return a 404 from nginx instead of loading the app.
