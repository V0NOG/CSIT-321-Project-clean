---
id: architecture
title: Architecture
sidebar_label: Architecture
---

# Architecture

## System Architecture

```mermaid
graph TB
    subgraph Browser["Browser — Client"]
        React["React 19 SPA\n(TypeScript + Vite)"]
        WebCrypto["Web Cryptography API\ncrypto.subtle"]
        LS["localStorage\n(JWT, device master key)"]
    end

    subgraph Server["Server — Node.js 20 / Express 5"]
        API["REST API  /api/*"]
        Middleware["Middleware\n(Helmet, CORS, verifyToken)"]
        Controllers["Controllers\n(auth, files, shares, folders,\nconnectors, acl, analytics, keys)"]
        Services["Services\n(crypto, audit, hashChain,\ndropbox, googledrive)"]
    end

    subgraph Data["Data Layer"]
        MongoDB[("MongoDB Atlas\nmetadata + keys + audit")]
        Dropbox["Dropbox API\nciphertext blobs"]
        GDrive["Google Drive API\nciphertext blobs"]
    end

    React -->|"HTTPS REST — Axios"| API
    React --> WebCrypto
    LS --> React
    API --> Middleware --> Controllers --> Services
    Services --> MongoDB
    Services --> Dropbox
    Services --> GDrive
```

---

## Deployment Architecture

```mermaid
graph LR
    User["User Browser"]
    FE["Frontend\nStatic build\nnginx / CDN"]
    BE["Backend\nNode.js + PM2"]
    DB[("MongoDB Atlas")]
    DP["Dropbox Cloud"]
    GD["Google Drive Cloud"]

    User -->|HTTPS| FE
    User -->|HTTPS REST| BE
    BE -->|TLS| DB
    BE -->|HTTPS API| DP
    BE -->|HTTPS API| GD
```

---

## Information Architecture

```
Cipher Cloud
├── Authentication Layer
│   ├── Email/Password (bcrypt + JWT)
│   ├── Google OAuth (ID token verification)
│   └── TOTP 2FA (otplib, encrypted secret)
│
├── Cryptographic Layer (Zero-Knowledge)
│   ├── Per-user RSA-4096 key pair
│   │   ├── Public key  → stored plaintext on server
│   │   └── Private key → AES-GCM encrypted by client; blob stored on server
│   ├── Per-file AES-256-GCM key
│   │   ├── Generated client-side at upload
│   │   └── Wrapped with owner RSA public key → FileKey (server)
│   └── Per-share key re-wrap
│       └── File AES key wrapped with recipient RSA public key → SharedFileKey (server)
│
├── Storage Layer
│   ├── MongoDB  (metadata: file records, users, shares, audit logs)
│   └── Cloud Providers  (ciphertext blobs)
│       ├── Dropbox (via OAuth connector)
│       └── Google Drive (via OAuth connector)
│
└── API Layer (Express 5, REST)
    ├── /api/auth         — Authentication & OAuth
    ├── /api/auth/totp    — 2FA management
    ├── /api/user         — Profile management
    ├── /api/keys         — RSA key management
    ├── /api/files        — File CRUD + upload/download
    ├── /api/folders      — Virtual folder organisation
    ├── /api/shares       — ZK file sharing
    ├── /api/acl          — Access control lists
    ├── /api/analytics    — Usage statistics
    ├── /api/connectors   — Cloud storage OAuth connectors
    └── /api/settings     — OAuth settings
```
