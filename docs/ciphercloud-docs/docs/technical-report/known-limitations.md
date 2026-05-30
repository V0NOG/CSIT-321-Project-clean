---
id: known-limitations
title: Known Limitations
sidebar_label: Known Limitations
---

# Known Limitations

The following limitations were identified during development and were accepted within the academic project scope. They represent known technical debt or design trade-offs that must be addressed before any production deployment.

---

## Security Limitations

### L1 — No Rate Limiting on Authentication Endpoints

| Field | Detail |
|-------|--------|
| **Affected routes** | `POST /api/auth/login`, `POST /api/auth/register` |
| **Risk** | Brute-force password attacks; credential stuffing |
| **Fix** | Add `express-rate-limit` middleware (e.g., 10 attempts per 15 minutes per IP) |
| **Effort** | Low — single middleware addition |

### L2 — OAuth Settings Not Admin-Guarded

| Field | Detail |
|-------|--------|
| **Affected routes** | `GET /api/settings/oauth`, `PUT /api/settings/oauth` |
| **Risk** | Any authenticated user can read or overwrite Google/Dropbox OAuth client credentials |
| **Fix** | Add `verifyAdmin` middleware to both routes |
| **Effort** | Low — one line per route |

### L3 — No MongoDB TTL Index on Sessions

| Field | Detail |
|-------|--------|
| **Affected collection** | `sessions` |
| **Risk** | Expired session documents accumulate indefinitely; potential storage growth |
| **Fix** | `db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })` |
| **Effort** | Trivial — one-time database command |

### L4 — Device Master Key Loss = Permanent File Loss

| Field | Detail |
|-------|--------|
| **Affected component** | `localStorage` / `zk.ts` |
| **Risk** | Clearing browser storage, using private mode, or switching devices permanently revokes access to all previously uploaded files. There is no server-side recovery mechanism by design (zero-knowledge). |
| **Fix** | Implement a key backup mechanism (e.g., encrypted key export to user-held password, or multi-device key sync using a passphrase-derived KDF) |
| **Effort** | High — significant cryptographic design work |

---

## Functional Limitations

### L5 — No File Versioning

| Field | Detail |
|-------|--------|
| **Description** | Uploading a file with the same name creates a second independent record. There is no version history, diff, or rollback. |
| **Impact** | Users must manually manage duplicate files |
| **Fix** | Add a `parentFileId` reference and version counter to the `File` schema |
| **Effort** | Medium |

### L6 — Shares Are One-to-One Only

| Field | Detail |
|-------|--------|
| **Description** | A file can be shared with individual users. There is no concept of shareable links, public access, or group shares. |
| **Impact** | Sharing with many recipients requires N separate share operations |
| **Fix** | Add a `ShareLink` model with optional password + expiry; per-link re-wrapped key |
| **Effort** | High |

### L7 — No Thumbnail or Preview

| Field | Detail |
|-------|--------|
| **Description** | Images and documents show a generic file type icon. There is no server-side thumbnail generation (server cannot decrypt) and no client-side preview rendering. |
| **Impact** | Users must download to view file content |
| **Fix** | Client-side preview rendering: decrypt in memory → render in `<canvas>` or `<iframe>` sandbox |
| **Effort** | Medium |

### L8 — CORS Restricted to localhost Origins

| Field | Detail |
|-------|--------|
| **Description** | The CORS allowlist in `server.js` is hardcoded to `localhost:5173` and `localhost:5174`. |
| **Impact** | The backend rejects requests from any production domain unless the config is updated |
| **Fix** | Move the CORS origin list to an environment variable (`ALLOWED_ORIGINS`) |
| **Effort** | Low |

---

## Out-of-Scope Items

The following features were explicitly excluded from the project scope and are not limitations but intentional non-requirements:

| Item | Reason excluded |
|------|----------------|
| Mobile application | Web SPA targets desktop browsers; native app requires separate project |
| Real-time collaboration | Requires WebSockets and conflict-resolution logic beyond scope |
| Admin dashboard UI | Backend admin middleware exists; no frontend admin panel was built |
| Audit log viewer UI | Audit log exists in MongoDB; no frontend table to browse it |
| Email notifications | No SMTP integration; share invitations are in-app only |
| File search / full-text index | Server cannot index encrypted content; client-side search not implemented |
