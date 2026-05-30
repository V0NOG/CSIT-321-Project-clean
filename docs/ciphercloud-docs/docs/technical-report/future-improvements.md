---
id: future-improvements
title: Future Improvements
sidebar_label: Future Improvements
---

# Future Improvements

The following improvements are recommended for post-submission development, ordered by priority. Items marked **Pre-Production Required** must be resolved before any real-world deployment.

---

## Pre-Production Security Fixes (Highest Priority)

| ID | Improvement | Effort | Detail |
|----|-------------|--------|--------|
| F1 | Rate limiting on auth endpoints | Low | `express-rate-limit`: 10 attempts / 15 min / IP on `/api/auth/login` and `/api/auth/register` |
| F2 | Admin guard on OAuth settings | Low | Add `verifyAdmin` to `GET/PUT /api/settings/oauth` |
| F3 | MongoDB TTL index on sessions | Trivial | `db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })` — prevents unbounded session collection growth |
| F4 | Environment-variable CORS origins | Low | Replace hardcoded `localhost` allowlist with `ALLOWED_ORIGINS` env var |
| F5 | HTTPS enforcement | Medium | Configure `COOKIE_SECURE=true`; redirect HTTP to HTTPS in nginx; obtain TLS certificate (Let's Encrypt) |

---

## Automated Testing

| ID | Improvement | Effort | Detail |
|----|-------------|--------|--------|
| F6 | Backend integration test suite | Medium | Supertest + in-memory MongoDB (mongodb-memory-server); cover all 54 API endpoints |
| F7 | Frontend crypto unit tests | Medium | Vitest; round-trip encrypt/decrypt; key wrap/unwrap; edge cases (empty files, large IVs) |
| F8 | End-to-end test suite | High | Playwright; golden paths: register → upload → share → accept → download |
| F9 | CI/CD pipeline | Medium | GitHub Actions: lint → type-check → unit tests → build on every PR |

---

## Cryptographic Enhancements

| ID | Improvement | Effort | Detail |
|----|-------------|--------|--------|
| F10 | Multi-device key sync | High | Derive a second encryption key from user passphrase (PBKDF2/Argon2); use it to encrypt the device master key for cross-device recovery |
| F11 | Key backup / export | Medium | Allow user to export an encrypted copy of their device master key, locked with a recovery passphrase |
| F12 | Audit log verification endpoint | Low | `GET /api/admin/audit/verify` — server recomputes hash chain and returns first-detected tampered entry |
| F13 | Key rotation | High | Allow users to re-encrypt all their `wrappedKeyB64` entries under a new RSA key pair |

---

## Feature Additions

| ID | Improvement | Effort | Detail |
|----|-------------|--------|--------|
| F14 | Shareable links | High | Generate a time-limited, optionally password-protected URL; server stores per-link re-wrapped key encrypted with a link secret |
| F15 | File versioning | Medium | Add `parentFileId` + `version` to `File` schema; version history panel in Explorer |
| F16 | Client-side file preview | Medium | Decrypt blob in memory → render image in `<canvas>` or PDF in sandboxed `<iframe>` |
| F17 | In-app audit log viewer | Low | Frontend table querying `GET /api/admin/audit`; filterable by actor, action, date |
| F18 | Email share notifications | Medium | Integrate nodemailer; send email when a share invitation is created |
| F19 | Group / team shares | High | `Group` model; single share operation distributes re-wrapped key to all group members |
| F20 | Admin dashboard | Medium | UI for user management, connector oversight, audit log, settings — protected by `verifyAdmin` |

---

## Performance & Scalability

| ID | Improvement | Effort | Detail |
|----|-------------|--------|--------|
| F21 | Chunked / resumable uploads | High | Split large files into chunks; upload independently; allows resuming after network failure |
| F22 | Worker thread encryption | Medium | Move `crypto.subtle` operations to a Web Worker to keep the UI responsive during large file encryption |
| F23 | MongoDB Atlas search indexes | Low | Add text index on `File.name` for server-side filename search (metadata only — content remains encrypted) |
| F24 | Connection pooling tuning | Low | Set `mongoose.connect` options: `maxPoolSize`, `serverSelectionTimeoutMS` based on load profile |

---

## Developer Experience

| ID | Improvement | Effort | Detail |
|----|-------------|--------|--------|
| F25 | Docker Compose dev environment | Low | Single `docker-compose up` to start MongoDB + backend + frontend |
| F26 | OpenAPI client code generation | Low | Use `openapi-typescript-codegen` to auto-generate typed API client from Swagger spec |
| F27 | Environment variable validation | Low | `zod` or `envalid` at startup — fail fast with a clear error if required env vars are missing |
| F28 | Structured logging | Medium | Replace `morgan` + `console.log` with `pino` — JSON logs with request IDs, suitable for log aggregation |
