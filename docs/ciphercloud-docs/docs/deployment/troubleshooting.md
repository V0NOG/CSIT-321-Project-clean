---
id: troubleshooting
title: Troubleshooting
sidebar_label: Troubleshooting
---

# Troubleshooting

The issues below are the problems a user is most likely to face during testing most of them are caused by missing cloud connections, expired sessions, browser restrictions, or interrupted uploads.

---

## Backend / Server Errors

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `Error: JWT_ACCESS_SECRET is not defined` | Missing `.env` file or variable | Check `backend/.env` exists and contains `JWT_ACCESS_SECRET` |
| `MongoServerError: Authentication failed` | Wrong MongoDB password | Re-check `MONGO_URI` credentials in `backend/.env` |
| `ECONNREFUSED 127.0.0.1:27017` | Local MongoDB not running | `brew services start mongodb-community` (macOS) or `sudo systemctl start mongod` (Linux) |
| `MongooseServerSelectionError: connect ECONNREFUSED` | Atlas IP not whitelisted | In Atlas → Network Access → add your current IP |
| `Error: listen EADDRINUSE :::3000` | Port 3000 already in use | `lsof -i :3000` to find the process; kill it or change `PORT` in `.env` |
| `TypeError: Cannot read properties of undefined (reading 'sub')` | Malformed JWT payload | Check `JWT_ACCESS_SECRET` matches the key used to sign tokens; clear browser tokens |
| `SyntaxError: Cannot use import statement` | Node.js version too old | Upgrade to Node.js 20.x (`node --version`) |
| `pnpm: command not found` | pnpm not installed | `npm install -g pnpm` |

---

## Frontend / Browser Errors

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| Blank white screen | React build error or missing `VITE_API_URL` | Open browser console; check for errors. Verify `frontend/.env` has `VITE_API_URL` |
| `Network Error` on all API calls | Backend not running or wrong API URL | Confirm backend is running at the URL in `VITE_API_URL` |
| CORS error in browser console | Backend `CLIENT_URL` does not match frontend origin | Set `CLIENT_URL=http://localhost:5173` in `backend/.env` |
| `DOMException: The operation is not supported` | Web Crypto API unavailable | Must be served over HTTPS or `localhost`. Cannot run over plain HTTP on a remote host. |
| Page reloads to 404 on direct URL | nginx `try_files` not configured | Add `try_files $uri $uri/ /index.html` to nginx location block |
| `Refused to execute inline script` | Content Security Policy too strict | Adjust `helmet()` CSP in `backend/server.js` or add nginx `Content-Security-Policy` header |

---

## File Upload Errors

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| Upload fails silently | No active storage connector | Connect Dropbox or Google Drive in the Connectors page |
| `413 Request Entity Too Large` | nginx body size limit | Set `client_max_body_size 500m` in nginx config; reload nginx |
| `MulterError: File too large` | Backend multer limit | Check `files.js` multer config; current limit is 500 MB |
| Upload completes but file doesn't appear | Phase 1/2/3 not completing | Check browser network tab for 4xx/5xx on `/api/files/init`, `/api/files/:id/key`, `/api/files/upload/:id` |
| `Error: encryptFileBlob failed` | Web Crypto error during client-side encryption | Check browser console for the underlying DOMException |

---

## File Download Errors

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| Downloaded file is corrupted | Device master key is different from upload | Do not clear localStorage between upload and download sessions |
| `401` on `/api/files/:id/key` | Access token expired; user not the owner | Refresh page to trigger token renewal; check if the file belongs to a share |
| Download link does nothing | Browser blocked the download | Check browser popup/download blocker settings |
| `Failed to decrypt: OperationError` | Wrong key or tampered ciphertext | The AES-GCM auth tag failed — data may be corrupted in storage |

---

## Authentication Errors

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `401 No token provided` | Token not being sent | Check `VITE_API_URL` has no trailing slash; check Axios config sends cookies |
| `401 Invalid or expired token` | Access token expired and refresh failed | Sign out and sign back in |
| `Google sign-in: token verification failed` | `GOOGLE_CLIENT_ID` mismatch | Backend `GOOGLE_CLIENT_ID` and frontend `VITE_GOOGLE_CLIENT_ID` must be identical |
| TOTP code rejected | System clock skew | Ensure server and client device clocks are synchronised (NTP) |
| Can't log in after enabling TOTP | No backup codes saved | TOTP cannot be bypassed; the account is locked — the database `totpEnabled` field must be manually reset |

---

## Storage Connector Errors

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| Dropbox OAuth redirect fails | Redirect URI mismatch | Verify `DROPBOX_REDIRECT_URI` in `.env` matches the URI registered in the Dropbox developer portal exactly |
| Google Drive connector returns `invalid_client` | Wrong client ID/secret | Re-check `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET` |
| `Error decrypting stored tokens` | `TOTP_ENC_KEY` changed since tokens were stored | Tokens encrypted with the old key cannot be decrypted; disconnect and reconnect the affected connector |
| Connector shows as connected but uploads fail | OAuth token expired with no refresh token | Disconnect and reconnect the connector to re-authorise |

---

## PM2 / Production

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `pm2 status` shows `errored` | Server crash on startup | `pm2 logs ciphercloud-api --lines 50` to see the error |
| Process not running after server reboot | `pm2 startup` not configured | Run `pm2 startup` and execute the generated command; then `pm2 save` |
| nginx returns `502 Bad Gateway` | Backend not running | `pm2 status`; restart with `pm2 restart ciphercloud-api` |
| TLS certificate expired | Certbot auto-renewal failed | `sudo certbot renew`; check cron job with `systemctl status certbot.timer` |
