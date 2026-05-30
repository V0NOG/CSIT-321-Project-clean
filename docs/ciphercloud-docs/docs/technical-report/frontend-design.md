---
id: frontend-design
title: Frontend Design
sidebar_label: Frontend Design
---

# Frontend Design

## Application Structure

```
frontend/src/
├── App.tsx                     — Root router; all route definitions
├── main.tsx                    — Entry point; context provider wrapping
├── api/                        — Axios API client modules (one per resource)
│   ├── analyticsApi.ts
│   ├── connectorsApi.ts
│   ├── filesApi.ts             — encryptWrapAndUpload, downloadDecryptedBlob
│   ├── foldersApi.ts
│   ├── keysApi.ts
│   ├── sharesApi.ts
│   └── userApi.ts
├── crypto/                     — All browser-side cryptography
│   ├── asymmetric.ts           — RSA-4096 key pair management
│   ├── encrypt.ts              — AES-256-GCM file encryption
│   ├── decrypt.ts              — AES-256-GCM file decryption
│   ├── keys.ts                 — Key export/import helpers
│   └── zk.ts                  — Device master key (localStorage)
├── context/                    — React Context providers
│   ├── AuthContext.tsx          — User session, JWT, keypair init
│   ├── SidebarContext.tsx
│   └── ThemeContext.tsx
├── components/                 — Reusable UI components
│   ├── analytics/
│   ├── auth/
│   ├── common/
│   ├── file-manager/           — FileCard, FolderCard, ShareModal
│   ├── header/
│   ├── security/               — TOTPSetupCard
│   └── ui/                     — Button, Modal, Badge, Dropdown, Spinner
├── pages/                      — Page-level route components
│   ├── Analytics.tsx
│   ├── Explorer.tsx            — Full file explorer with DnD + context menus
│   ├── FileManager.tsx
│   ├── FolderFiles.tsx
│   ├── SharedWithMe.tsx
│   ├── StorageConnectors.tsx
│   ├── UserProfiles.tsx
│   └── Security/TotpSetup.tsx
└── routes/
    └── ProtectedRoute.tsx      — Redirects unauthenticated users to /signin
```

## Route Map

| Path | Component | Auth Required |
|------|-----------|--------------|
| `/signin` | `SignIn` | No |
| `/signup` | `SignUp` | No |
| `/` | `FileManager` | Yes |
| `/file-manager` | `FileManager` | Yes |
| `/file-manager/folder/:bucket` | `FolderFiles` | Yes |
| `/file-manager/folder/custom/:folderId` | `FolderFiles` | Yes |
| `/explorer` | `Explorer` | Yes |
| `/analytics` | `Analytics` | Yes |
| `/shared` | `SharedWithMe` | Yes |
| `/connectors` | `StorageConnectors` | Yes |
| `/profile` | `UserProfiles` | Yes |
| `/security/mfa` | `TotpSetup` | Yes |
| `*` | `NotFound` | No |

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Context over Redux | Auth, theme, and sidebar state are simple enough for React Context — no need for Redux overhead |
| API layer isolation | All Axios calls live in `src/api/` — page components never call Axios directly; makes API changes a single-file concern |
| Crypto isolation | All `crypto.subtle` calls live in `src/crypto/` — components interact with high-level functions only |
| `encryptWrapAndUpload` abstraction | Encapsulates the entire three-phase upload (encrypt → wrap key → upload ciphertext) behind a single function call |
| `downloadDecryptedBlob` abstraction | Encapsulates key fetch → unwrap → ciphertext fetch → decrypt behind a single function call |
| Dark mode via Tailwind `dark:` | `ThemeContext` manages preference and persists to `localStorage`; Tailwind dark variants applied site-wide |
