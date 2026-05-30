---
id: api-reference
title: API Reference
sidebar_label: API Reference
---

# API Reference

The full interactive API reference is available via Swagger UI at `/api-docs` when the backend is running.

## Base URL

```
http://localhost:3000/api   (development)
https://your-domain.com/api (production)
```

All protected endpoints require a valid JWT passed as:
- `Authorization: Bearer <token>` header, **or**
- `accessToken` HttpOnly cookie (set automatically after login)

---

## Authentication — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | None | Register new account (email + password) |
| `POST` | `/api/auth/login` | None | Email/password login — returns access token + sets refresh cookie |
| `POST` | `/api/auth/google` | None | Google OAuth login (ID token exchange) |
| `POST` | `/api/auth/refresh` | Cookie | Issue new access token using refresh cookie |
| `POST` | `/api/auth/logout` | Token | Revoke current session |

### TOTP — `/api/auth/totp`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/totp/setup` | Token | Generate TOTP secret; returns QR URI |
| `POST` | `/api/auth/totp/enable` | Token | Verify TOTP code and enable 2FA |
| `POST` | `/api/auth/totp/disable` | Token | Disable 2FA (requires current TOTP code) |
| `POST` | `/api/auth/totp/verify` | Token | Verify TOTP code during login |

---

## Users — `/api/user`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/user/profile` | Token | Get own profile (email, role, totpEnabled) |
| `PUT` | `/api/user/profile` | Token | Update profile fields |
| `GET` | `/api/user/search` | Token | Search users by email (for share recipient lookup) |

---

## RSA Keys — `/api/keys`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/keys` | Token | Store generated RSA-4096 key pair (pubKey + encPrivKey blob) |
| `GET` | `/api/keys` | Token | Retrieve own key pair (pubKey + encPrivKey blob) |
| `PUT` | `/api/keys` | Token | Replace key pair |
| `GET` | `/api/keys/public/:userId` | Token | Fetch another user's public key (used in ZK share flow) |

---

## Files — `/api/files`

Three-phase upload: `init` → `key` → `upload`. All file content is stored as ciphertext blobs on the cloud provider; the server never holds plaintext.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/files/init` | Token | **Phase 1** — create File metadata record; returns `fileId` |
| `POST` | `/api/files/:id/key` | Token | **Phase 2** — store RSA-wrapped AES-256-GCM file key |
| `POST` | `/api/files/upload/:id` | Token | **Phase 3** — stream raw ciphertext blob (500 MB limit, `application/octet-stream`) |
| `GET` | `/api/files` | Token | List all files owned by the authenticated user |
| `GET` | `/api/files/:id/download` | Token | Fetch ciphertext blob for client-side decryption |
| `GET` | `/api/files/:id/key` | Token | Retrieve wrapped AES key for a file (owner or share recipient) |
| `PUT` | `/api/files/:id/rename` | Token | Rename a file |
| `PUT` | `/api/files/:id/move` | Token | Move file to a different folder |
| `DELETE` | `/api/files/:id` | Token | Delete file record + ciphertext blob from storage provider |

---

## Folders — `/api/folders`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/folders` | Token | Create a new virtual folder (name + optional colour) |
| `GET` | `/api/folders` | Token | List all folders owned by the authenticated user |
| `PUT` | `/api/folders/:id` | Token | Rename or recolour a folder |
| `DELETE` | `/api/folders/:id` | Token | Delete folder (files are not deleted, just unassigned) |

---

## Shares — `/api/shares`

The zero-knowledge share flow requires the owner's browser to re-wrap the file AES key with the recipient's RSA public key. The server only ever stores the resulting ciphertext blob.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/shares` | Token | Initiate share — creates Share record (status: `pending`) |
| `GET` | `/api/shares` | Token | List all outgoing shares created by the authenticated user |
| `GET` | `/api/shares/inbox` | Token | List incoming share invitations for the authenticated user |
| `GET` | `/api/shares/shared-with-me` | Token | List accepted shares — files shared with this user |
| `GET` | `/api/shares/:id` | Token | Get a single share record |
| `PUT` | `/api/shares/:id/accept` | Token | Recipient accepts a share invitation |
| `PUT` | `/api/shares/:id/decline` | Token | Recipient declines a share invitation |
| `DELETE` | `/api/shares/:id` | Token | Owner revokes an active share |
| `POST` | `/api/shares/:id/key` | Token | Owner provides re-wrapped AES key to recipient (ZK key exchange) |
| `GET` | `/api/shares/:id/key` | Token | Recipient retrieves their wrapped AES key |
| `PUT` | `/api/shares/:id/respond` | Token | Generic accept/decline response endpoint |
| `GET` | `/api/shares/file/:fileId` | Token | List all shares for a specific file |

---

## Access Control Lists — `/api/acl`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/acl/:fileId` | Token | Get ACL entries for a file |
| `POST` | `/api/acl/:fileId` | Token | Add an ACL entry |
| `DELETE` | `/api/acl/:fileId/:userId` | Token | Remove an ACL entry |

---

## Analytics — `/api/analytics`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/analytics/summary` | Token | File count, total size, type breakdown, upload history |

---

## Storage Connectors — `/api/connectors`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/connectors` | Token | List all storage connectors for the authenticated user |
| `POST` | `/api/connectors/dropbox` | Token | Connect Dropbox account (OAuth code exchange) |
| `POST` | `/api/connectors/googledrive` | Token | Connect Google Drive account (OAuth code exchange) |
| `DELETE` | `/api/connectors/:id` | Token | Disconnect and delete a storage connector |
| `PUT` | `/api/connectors/:id/activate` | Token | Set a connector as the active storage destination |

---

## Settings — `/api/settings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/settings/oauth` | Token | Retrieve OAuth client credentials (Google, Dropbox) |
| `PUT` | `/api/settings/oauth` | Token | Update OAuth client credentials |

:::warning Security gap
`GET/PUT /api/settings/oauth` currently requires only `verifyToken` — any authenticated user can read or modify OAuth credentials. A `verifyAdmin` guard must be added before production deployment.
:::

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / validation error |
| `401` | Missing or invalid token |
| `403` | Authenticated but not authorised (wrong owner) |
| `404` | Resource not found |
| `409` | Conflict (duplicate resource) |
| `500` | Internal server error |

---

## Swagger UI

When the backend is running locally, navigate to:

```
http://localhost:3000/api-docs
```

The Swagger UI is generated from JSDoc annotations in each route file using `swagger-jsdoc`. All request bodies, response schemas, and security requirements are documented inline.
