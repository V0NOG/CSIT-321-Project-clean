---
id: backend-design
title: Backend Design
sidebar_label: Backend Design
---

# Backend Design

## Application Structure

```
backend/
├── server.js                   — Entry point: app init, middleware, route mounting, DB connect
├── swagger.js                  — OpenAPI 3.0 spec configuration
├── config/
│   └── jwt.js                  — JWT signing/verification helpers
├── middleware/
│   └── auth.js                 — verifyToken, verifyAdmin
├── routes/                     — One router file per resource domain
│   ├── auth.js                 — Register, login, Google OAuth, refresh, logout
│   ├── totp.js                 — TOTP setup, enable, disable
│   ├── user.js                 — Profile read/update, user search
│   ├── keys.js                 — RSA key pair CRUD + public key lookup
│   ├── files.js                — Upload (3-phase), download, list, rename, delete
│   ├── folders.js              — Folder CRUD + file move
│   ├── shares.js               — Share lifecycle: create, accept, decline, revoke, key exchange
│   ├── acl.js                  — Per-file access control lists
│   ├── analytics.js            — Usage summary
│   ├── connectors.js           — OAuth connector management (Dropbox + Google Drive)
│   └── settings.js             — OAuth credential settings
├── controllers/                — Business logic for each route module
├── models/                     — Mongoose schemas (see Database Design)
└── services/
    ├── audit.js                — Writes audit log entries with hash chain
    ├── crypto.js               — AES-GCM seal/open for server-side secrets
    ├── hashChain.js            — SHA-256 audit log chaining
    ├── dropbox.js              — Dropbox API adapter (app-level)
    ├── userdropbox.js          — Dropbox adapter for per-user OAuth connectors
    ├── googledrive.js          — Google Drive API adapter
    └── credentialLoader.js     — Loads OAuth credentials from DB or environment
```

## Express Middleware Stack

Applied in this order by `server.js`:

| Order | Middleware | Purpose |
|-------|-----------|---------|
| 1 | `helmet()` | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| 2 | `morgan("dev")` | HTTP request logging to stdout |
| 3 | `express.json({ limit: "1mb" })` | JSON body parsing with 1 MB cap |
| 4 | `cookieParser()` | Parses `accessToken` HttpOnly cookie |
| 5 | `cors(...)` | Restricts to `localhost:5173` and `localhost:5174` |
| 6 | Custom logger | Logs `[METHOD] /path` to console |
| 7 | Route handlers | Business logic |
| 8 | Central error handler | Catches unhandled errors; returns `{ error: message }` |

## Authentication Middleware

```js title="backend/middleware/auth.js"
export const verifyToken = (req, res, next) => {
  // Accepts token from: Authorization: Bearer <token>  OR  cookie: accessToken
  let token = req.headers.authorization?.split(" ")[1]
           ?? req.cookies?.accessToken;

  if (!token) return res.status(401).json({ message: "No token provided." });

  const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  req.user = { id: payload.sub || payload.id, role: payload.role };
  next();
};
```
