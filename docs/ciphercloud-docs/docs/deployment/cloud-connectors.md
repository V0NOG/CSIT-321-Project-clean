---
id: cloud-connectors
title: Cloud Connector Setup
sidebar_label: Cloud Connectors
---

# Cloud Connector Setup

Cipher Cloud stores encrypted file blobs on user-authorised cloud storage accounts. Two providers are supported: **Dropbox** and **Google Drive**. Setting up each provider requires creating a developer application in that provider's developer console.

:::info Optional
Cloud connectors are optional for local development. You can upload and download files without a connector configured the backend will use a default local or fallback storage path if no connector is active.
:::

---

## Dropbox

### Create a Dropbox App

1. Go to [dropbox.com/developers/apps](https://www.dropbox.com/developers/apps) and sign in.
2. Click **Create app**.
3. Choose **Scoped access** → **Full Dropbox** access.
4. Name your app (e.g., `Cipher Cloud Dev`).
5. Click **Create app**.

### Configure Redirect URIs

Under the **Settings** tab of your new app:

1. Find **OAuth 2 → Redirect URIs**.
2. Add:
   - `http://localhost:3000/api/connectors/dropbox/callback` (development)
   - `https://your-domain.com/api/connectors/dropbox/callback` (production)

### Get Your Credentials

From the **Settings** tab, copy:
- **App key** → `DROPBOX_APP_KEY` in `backend/.env`
- **App secret** → `DROPBOX_APP_SECRET` in `backend/.env`

Also set the App key in the frontend:
- `VITE_DROPBOX_APP_KEY` in `frontend/.env`

### Required Scopes

| Scope | Purpose |
|-------|---------|
| `files.content.write` | Upload encrypted blobs |
| `files.content.read` | Download encrypted blobs |
| `files.metadata.read` | List and manage stored files |

---

## Google Drive

### Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in.
2. Click the project selector → **New Project**. Name it `Cipher Cloud`.
3. With the project selected, navigate to **APIs & Services → Library**.
4. Search for and enable **Google Drive API**.

### Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Select **External** user type.
3. Fill in App name (`Cipher Cloud`), user support email, and developer email.
4. Add scopes: `https://www.googleapis.com/auth/drive.file`
5. Add your email as a test user.
6. Save and continue.

### Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Add **Authorised redirect URIs**:
   - `http://localhost:3000/api/connectors/googledrive/callback` (development)
   - `https://your-domain.com/api/connectors/googledrive/callback` (production)
4. Click **Create** and download the JSON, or copy:
   - **Client ID** → `GOOGLE_DRIVE_CLIENT_ID` in `backend/.env` and `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`
   - **Client Secret** → `GOOGLE_DRIVE_CLIENT_SECRET` in `backend/.env`

### Google OAuth Sign-In (Separate from Drive)

If also using Google as an identity provider (sign-in with Google):

1. Create a second OAuth 2.0 credential (or reuse the same one).
2. Add `http://localhost:5173` to **Authorised JavaScript origins**.
3. The **Client ID** maps to `GOOGLE_CLIENT_ID` in `backend/.env` and `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`.

---

## Connecting a Connector in the App

Once credentials are configured:

1. Sign in to Cipher Cloud.
2. Navigate to **Storage Connectors** in the sidebar.
3. Click **Connect Dropbox** or **Connect Google Drive**.
4. Complete the OAuth authorisation flow in the popup.
5. The connector will appear as **Active** in the list.

When a connector is active, all subsequent file uploads are routed through that provider. OAuth tokens are encrypted with `TOTP_ENC_KEY` before storage in the `storageconnectors` collection.
