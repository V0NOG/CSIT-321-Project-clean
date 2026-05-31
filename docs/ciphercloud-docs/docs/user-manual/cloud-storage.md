---
id: cloud-storage
title: Connecting Cloud Storage
sidebar_label: Cloud Storage
---

# Connecting Cloud Storage

Cipher Cloud stores your encrypted files in your personal Dropbox or Google Drive account. You must connect **at least one** cloud storage account before you can upload files.

---

## Connecting Dropbox

1. Click **Connectors** in the left sidebar.
2. Click **Connect Dropbox**.
3. A new browser window will open — log in to Dropbox if prompted.
4. Click **Allow** to grant Cipher Cloud access.
5. The window will close automatically. Dropbox will appear as a connected account.

:::info What Cipher Cloud stores in your Dropbox
Cipher Cloud creates an app folder in your Dropbox and stores encrypted `.bin` files there. The filenames are internal identifiers — the original filename and content are never visible in Dropbox.
:::
---

## Connecting Google Drive

1. Click **Connectors** in the left sidebar.
2. Click **Connect Google Drive**.
3. A new browser window will open — select your Google account.
4. Click **Allow** to grant Cipher Cloud access.
5. The window will close. Google Drive will appear as a connected account.

:::info
The Google Drive connector is currently write-only. Files uploaded via Cipher Cloud are stored in your Drive, but you cannot browse your existing Drive files from within Cipher Cloud.
:::

---

## Disconnecting a Cloud Account

1. Click **Connectors** in the left sidebar.
2. Find the account you want to disconnect.
3. Click **Disconnect** next to that account.
4. Confirm the disconnection.

:::warning Your files are not deleted
Disconnecting a storage account does not delete your encrypted files. The files remain in your Dropbox or Google Drive. You can reconnect the account at any time to regain access through Cipher Cloud.
:::

---

## Managing Multiple Accounts

You can connect more than one account — for example, both Dropbox and Google Drive, or two separate Dropbox accounts. When uploading, Cipher Cloud will use your connected account. If you have multiple connectors, select which one to use during upload.
