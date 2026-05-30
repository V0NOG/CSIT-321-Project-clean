---
id: prerequisites
title: Prerequisites
sidebar_label: Prerequisites
---

# Prerequisites

Before using Cipher Cloud, ensure you have the following.

## Required

| Requirement | Detail |
|-------------|--------|
| A modern web browser | Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari (current version) |
| An internet connection | Required for all operations |
| An email address | Required for registration |

## Required for File Storage

You must connect **at least one** of the following before you can upload files:

| Provider | Notes |
|----------|-------|
| **Dropbox** | A free or paid Dropbox account. Cipher Cloud stores your encrypted files inside your Dropbox. |
| **Google Drive** | A Google account with Google Drive access. Cipher Cloud uploads encrypted files to your Drive. |

:::info
Cipher Cloud does **not** provide its own storage. It uses your existing cloud account as a secure, encrypted backend.
:::

## Optional

| Requirement | Purpose |
|-------------|---------|
| An authenticator app | Required only if you enable two-factor authentication. Recommended apps: Google Authenticator, Authy, Microsoft Authenticator. |

## Browser Compatibility

Cipher Cloud uses the **Web Cryptography API** (`crypto.subtle`), which is built into all modern browsers. The following are confirmed compatible:

| Browser | Minimum Version |
|---------|----------------|
| Google Chrome | 90+ |
| Mozilla Firefox | 90+ |
| Microsoft Edge | 90+ |
| Apple Safari | 15+ |

:::warning
Internet Explorer is not supported. Private/Incognito mode may cause issues with key storage (your encryption key is stored in `localStorage`, which some browsers restrict in private mode).
:::
