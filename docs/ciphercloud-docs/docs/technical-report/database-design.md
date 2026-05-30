---
id: database-design
title: Database & Data Model
sidebar_label: Database Design
---

# Database & Data Model

## Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string email
        string password
        string pubKey
        string encPrivKey
        boolean totpEnabled
        string totpSecretEnc
        string role
    }
    FILE {
        ObjectId _id PK
        ObjectId owner FK
        string name
        number size
        string mime
        string status
        ObjectId folder FK
        ObjectId connector FK
        string storage_ivB64
        boolean isSharedCopy
    }
    FILEKEY {
        ObjectId _id PK
        ObjectId file FK
        ObjectId owner FK
        string wrappedKeyB64
    }
    FOLDER {
        ObjectId _id PK
        ObjectId owner FK
        string name
        string color
    }
    SHARE {
        ObjectId _id PK
        ObjectId file FK
        ObjectId owner FK
        ObjectId targetUser FK
        string targetEmail
        string permission
        string status
        boolean keyProvided
    }
    SHAREDFILEKEY {
        ObjectId _id PK
        ObjectId share FK
        ObjectId file FK
        ObjectId senderUser FK
        ObjectId recipientUser FK
        string wrappedKeyB64
    }
    STORAGECONNECTOR {
        ObjectId _id PK
        ObjectId owner FK
        string provider
        string encTokens
        boolean isActive
    }
    SESSION {
        ObjectId _id PK
        ObjectId userId FK
        string refreshJti
        boolean revoked
        date expiresAt
    }
    AUDITLOG {
        ObjectId _id PK
        ObjectId actorId FK
        string action
        string prevHash
        string hash
    }

    USER ||--o{ FILE : owns
    USER ||--o{ FILEKEY : holds
    USER ||--o{ FOLDER : creates
    USER ||--o{ SHARE : initiates
    USER ||--o{ STORAGECONNECTOR : connects
    USER ||--o{ SESSION : has
    FILE ||--|| FILEKEY : encrypted_by
    FILE ||--o{ SHARE : subject_of
    SHARE ||--o| SHAREDFILEKEY : has
    FOLDER ||--o{ FILE : contains
    STORAGECONNECTOR ||--o{ FILE : stores
```

## Design Principles

| Principle | Implementation |
|-----------|---------------|
| Content separate from metadata | `files` collection stores only metadata — no file content |
| Keys separate from data | `filekeys` and `sharedfilekeys` are separate collections; access checked independently |
| Encrypted sensitive fields | `encPrivKey`, `totpSecretEnc`, `encTokens` are all stored as AES-GCM ciphertext blobs |
| Audit integrity | `auditlogs` uses a hash chain — each entry's hash includes `prevHash` |
| Unique compound indexes | `{ owner, name }` on Folder; `{ file, owner }` on FileKey; `{ share, recipientUser }` on SharedFileKey |

## Collection Summary

| Collection | Records stored | Sensitive fields encrypted |
|------------|---------------|--------------------------|
| `users` | Profile data, public key, encrypted private key, encrypted TOTP secret | `encPrivKey`, `totpSecretEnc` |
| `files` | Filename, size, MIME type, IV, status, folder, connector reference | None (no content) |
| `filekeys` | RSA-wrapped AES file keys (owner) | Not readable by server |
| `folders` | Name, colour, owner | None |
| `shares` | Share status, permission, target user/email | None |
| `sharedfilekeys` | RSA-wrapped AES file keys (recipient) | Not readable by server |
| `storageconnectors` | Provider, display name, encrypted OAuth tokens | `encTokens` |
| `sessions` | Refresh token JTI, revocation flag, expiry | None |
| `auditlogs` | Action type, actor, target, SHA-256 hash chain | None |
| `appsettings` | OAuth credentials (Google Client ID etc.) | Should be guarded by admin role |
