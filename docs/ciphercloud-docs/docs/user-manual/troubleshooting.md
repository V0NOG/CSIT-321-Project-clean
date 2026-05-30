---
id: troubleshooting
title: Troubleshooting
sidebar_label: Troubleshooting
---

# Troubleshooting

## Upload Issues

| Error | Possible Cause | Solution |
|-------|---------------|---------|
| "Upload failed" | No cloud storage account connected | Go to **Connectors** and connect Dropbox or Google Drive |
| "Upload failed" | File exceeds 500 MB | Split or compress the file before uploading |
| "Upload failed" | Poor internet connection | Check your connection and try again |
| "Upload failed" | Cloud storage account is full | Free up space in your Dropbox or Google Drive |
| Upload spinner never stops | Browser tab was refreshed mid-upload | Re-upload the file; partially uploaded files are cleaned up automatically |

---

## Download Issues

| Error | Possible Cause | Solution |
|-------|---------------|---------|
| "Download failed" | Encryption key not found on this device | Try the browser/device where you originally uploaded the file |
| File downloads but appears corrupted | Connection interrupted | Try again on a stable connection |
| Shared file won't download | Owner has not provided the encryption key | Ask the owner to complete the sharing process |
| Browser blocks the download | Pop-up/download blocker | Allow downloads from Cipher Cloud in your browser settings |

---

## Sign-In Issues

| Error | Possible Cause | Solution |
|-------|---------------|---------|
| "Invalid email or password" | Typo in credentials | Check caps lock re-enter credentials carefully |
| "Invalid or expired token" | Session expired after 55 minutes | Sign in again |
| 2FA code rejected | Phone time not synced | Set your phone clock to automatic time |
| Google sign-in fails | Pop-up blocked | Allow pop-ups from Cipher Cloud in your browser settings |

---

## Cloud Connector Issues

| Error | Possible Cause | Solution |
|-------|---------------|---------|
| Dropbox connection fails | Pop-up blocked | Allow pop-ups for Cipher Cloud and try again |
| Google Drive connection fails | Google account has restrictions | Try with a standard personal Google account |
| Connector shows as disconnected | Token expired | Disconnect and reconnect the account |

---

## General Issues

| Issue | Solution |
|-------|---------|
| Page shows a blank screen | Hard-refresh the page (`Ctrl+Shift+R` / `Cmd+Shift+R`) |
| Files not appearing after upload | Refresh the Explorer page |
| Dark mode not saving | Clear browser cache and sign in again |
| Session expired message every hour | Known limitation sign in again; token auto-refresh is coming in a future update |