---
id: database-setup
title: Database Setup
sidebar_label: Database Setup
---

# Database Setup

Cipher Cloud uses MongoDB as its metadata store. All file content is stored on cloud providers (Dropbox, Google Drive) — MongoDB holds only metadata, encrypted keys, and audit logs.

---

## Option A — MongoDB Atlas (Recommended)

MongoDB Atlas is the recommended option. A free M0 cluster is sufficient for development and small-scale use.

### Steps

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create an account.
2. Create a new project and build a free **M0** cluster in a region close to your users.
3. Under **Database Access**, create a database user with **Read and Write** permissions.
4. Under **Network Access**, add your server IP address (or `0.0.0.0/0` for development — restrict this in production).
5. Click **Connect → Drivers** and copy the connection string.
6. Replace `<password>` with your database user's password.
7. Paste the string into `MONGO_URI` in `backend/.env`.

```bash title="backend/.env"
MONGO_URI=mongodb+srv://myuser:mypassword@cluster0.mongodb.net/ciphercloud?retryWrites=true&w=majority
```

### Required TTL Index (Post-Setup)

After first run, create the TTL index to automatically expire old session records:

```js
// Run in MongoDB Atlas Data Explorer or mongosh
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

Without this, session documents accumulate indefinitely.

---

## Option B — Local MongoDB

For offline development without an Atlas account:

```bash
# Install MongoDB Community Edition
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Verify running
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

```bash title="backend/.env"
MONGO_URI=mongodb://localhost:27017/ciphercloud
```

---

## Schema Initialisation

Mongoose creates collections and indexes automatically on first use. There are no migration scripts to run. The following indexes are created by the Mongoose schema definitions:

| Collection | Index |
|------------|-------|
| `folders` | `{ owner, name }` — unique compound |
| `filekeys` | `{ file, owner }` — unique compound |
| `sharedfilekeys` | `{ share, recipientUser }` — unique compound |
| `sessions` | `{ expiresAt: 1 }` — TTL (must be created manually — see above) |

---

## Collections Overview

| Collection | Purpose |
|------------|---------|
| `users` | Accounts, bcrypt passwords, RSA public key, encrypted private key blob |
| `files` | File metadata (name, size, MIME, IV, folder, connector reference) |
| `filekeys` | Per-file RSA-wrapped AES keys (owner copy) |
| `folders` | Virtual folder records |
| `shares` | Share invitations and their status |
| `sharedfilekeys` | Per-share RSA-wrapped AES keys (recipient copy) |
| `storageconnectors` | Per-user cloud storage OAuth connectors (encrypted tokens) |
| `sessions` | Refresh token JTIs with revocation flag and expiry |
| `auditlogs` | SHA-256 hash-chained immutable activity log |
| `appsettings` | Admin-managed OAuth credentials |

---

## Backing Up Atlas Data

Use `mongodump` with your Atlas connection string:

```bash
mongodump \
  --uri="mongodb+srv://user:pass@cluster.mongodb.net/ciphercloud" \
  --out=./backup-$(date +%Y%m%d)
```

Restore with `mongorestore`. Note: file ciphertext blobs are stored on Dropbox/Google Drive, not in MongoDB — back up those separately using each provider's export tools.
