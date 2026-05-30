---
id: backend-setup
title: Backend Setup
sidebar_label: Backend Setup
---

# Backend Setup

## Install Dependencies

```bash
cd backend
pnpm install
```

:::note pnpm required
The project declares `"packageManager": "pnpm@10.11.1"` in `package.json`. Using `npm install` will work but may produce a different lockfile — use pnpm to stay consistent.
:::

---

## Environment Variables

Create a `.env` file in the `backend/` directory. Use the template below:

```bash title="backend/.env"
# ─── Server ───────────────────────────────────────
PORT=3000
NODE_ENV=development

# ─── MongoDB ──────────────────────────────────────
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ciphercloud?retryWrites=true&w=majority

# ─── JWT ──────────────────────────────────────────
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=<64-byte-hex-string>
JWT_REFRESH_SECRET=<64-byte-hex-string>

# ─── TOTP & Server-side AES encryption ───────────
# Must be exactly 32 bytes (64 hex chars) — used for TOTP secrets AND OAuth token encryption
TOTP_ENC_KEY=<64-byte-hex-string>

# ─── Cookies ──────────────────────────────────────
COOKIE_SECURE=false          # true in production (requires HTTPS)
COOKIE_SAME_SITE=lax         # strict in production

# ─── Google OAuth (server-side ID token verification) ─
GOOGLE_CLIENT_ID=<your-google-client-id>

# ─── Dropbox App Credentials (app-level, optional) ─
DROPBOX_APP_KEY=<your-dropbox-app-key>
DROPBOX_APP_SECRET=<your-dropbox-app-secret>
DROPBOX_REDIRECT_URI=http://localhost:3000/api/connectors/dropbox/callback

# ─── Google Drive App Credentials (optional) ──────
GOOGLE_DRIVE_CLIENT_ID=<your-google-drive-client-id>
GOOGLE_DRIVE_CLIENT_SECRET=<your-google-drive-client-secret>
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/api/connectors/googledrive/callback

# ─── Frontend origin (for CORS) ───────────────────
CLIENT_URL=http://localhost:5173
```

### Generating Secret Keys

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this three times to generate distinct values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `TOTP_ENC_KEY`.

:::danger Never commit .env
Add `.env` to `.gitignore`. Committing secret keys to a repository is a critical security incident.
:::

---

## Key Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 5.1.0 | HTTP framework |
| `mongoose` | 8.x | MongoDB ODM |
| `bcryptjs` | 2.x | Password hashing (12 salt rounds) |
| `jsonwebtoken` | 9.x | JWT sign/verify |
| `helmet` | 8.x | Security HTTP headers |
| `cors` | 2.x | Cross-origin request policy |
| `multer` | 1.x | Multipart file upload (500 MB limit) |
| `otplib` | 12.x | TOTP generation and verification |
| `dropbox` | 10.x | Dropbox SDK |
| `google-auth-library` | 9.x | Google ID token verification |
| `swagger-jsdoc` + `swagger-ui-express` | — | OpenAPI documentation |
| `morgan` | 1.x | HTTP request logging |
| `cookie-parser` | 1.x | Cookie parsing middleware |

---

## Start Commands

| Command | Usage |
|---------|-------|
| `pnpm dev` | Development mode with file watching (nodemon) |
| `pnpm start` | Production mode (no file watching) |

### Verify the server is running

```bash
curl http://localhost:3000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'
# Expected: 401 {"message":"Invalid credentials."}
```

Swagger UI: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
