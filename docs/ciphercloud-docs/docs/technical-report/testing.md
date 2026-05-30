---
id: testing
title: Testing
sidebar_label: Testing
---

# Testing

## Testing Approach

Due to the academic scope and timeline of this project, the testing strategy relied on **manual functional testing** performed by the development team across all four iterations. The cryptographic correctness was verified through round-trip tests (encrypt then decrypt the same file and compare hashes). No automated unit or integration test suite was implemented.

---

## Manual Test Coverage

### Authentication

| Test Case | Steps | Expected | Result |
|-----------|-------|----------|--------|
| Register with valid email/password | Submit registration form | Account created; redirected to sign-in | Pass |
| Register with duplicate email | Submit form with existing email | Error message displayed | Pass |
| Login with correct credentials | Submit sign-in form | Access token issued; dashboard shown | Pass |
| Login with wrong password | Submit incorrect password | 401 error displayed | Pass |
| Google OAuth sign-in | Click "Sign in with Google" | OAuth flow completes; session active | Pass |
| JWT expiry handling | Wait for 55-minute access token to expire | Refresh token used automatically | Pass |
| Logout clears session | Click logout | Refresh cookie revoked; redirected to sign-in | Pass |

### TOTP / 2FA

| Test Case | Steps | Expected | Result |
|-----------|-------|----------|--------|
| Enable 2FA | Navigate to Security → scan QR code → enter code | 2FA enabled | Pass |
| Login with 2FA | After password login, enter TOTP code | Session granted | Pass |
| Wrong TOTP code rejected | Enter incorrect code | 401 returned; login blocked | Pass |
| Disable 2FA | Enter current code → disable | 2FA off; login no longer requires code | Pass |

### File Operations

| Test Case | Steps | Expected | Result |
|-----------|-------|----------|--------|
| Upload a file | Select file via picker → upload | File appears in list | Pass |
| Upload via drag-and-drop | Drag file onto Explorer dropzone | Upload initiates | Pass |
| Download and verify integrity | Download file → compare hash to original | Hashes match (round-trip verified) | Pass |
| Rename file | Right-click → Rename | File name updated in list | Pass |
| Move file to folder | Right-click → Move / drag to folder | File appears under new folder | Pass |
| Delete file | Right-click → Delete → confirm | File removed from list and cloud storage | Pass |
| Upload 0-byte file | Select empty file | Handled gracefully (rejected or stored) | Pass |
| Upload at size limit | Upload file approaching 500 MB | Upload completes or error shown | Pass |

### Folder Operations

| Test Case | Steps | Expected | Result |
|-----------|-------|----------|--------|
| Create folder | Click "New Folder" → enter name | Folder appears in sidebar | Pass |
| Rename folder | Right-click folder → Rename | Name updated | Pass |
| Delete empty folder | Right-click → Delete | Folder removed | Pass |
| Drag file into folder | Drag file card over folder card | File moves to folder | Pass |

### File Sharing

| Test Case | Steps | Expected | Result |
|-----------|-------|----------|--------|
| Share file with registered user | Enter recipient email → share | Share appears in recipient inbox | Pass |
| Recipient accepts share | Open inbox → Accept | File appears in "Shared With Me" | Pass |
| Recipient declines share | Open inbox → Decline | Share removed from inbox | Pass |
| Owner revokes active share | Shares list → Revoke | Recipient loses access | Pass |
| Download shared file | Shared With Me → download | File decrypts correctly in recipient browser | Pass |
| Share with non-existent user | Enter unknown email | Error returned | Pass |

### Storage Connectors

| Test Case | Steps | Expected | Result |
|-----------|-------|----------|--------|
| Connect Dropbox account | Connectors page → Connect Dropbox → OAuth flow | Connector listed as active | Pass |
| Connect Google Drive | Connectors page → Connect Google Drive → OAuth flow | Connector listed as active | Pass |
| Upload to connected provider | Select connector during upload | File stored in cloud account | Pass |
| Disconnect connector | Connectors → Disconnect | Connector removed | Pass |

### Analytics

| Test Case | Steps | Expected | Result |
|-----------|-------|----------|--------|
| View analytics dashboard | Navigate to Analytics | KPI tiles, charts rendered | Pass |
| Analytics reflect uploads | Upload a file → revisit analytics | Counts updated | Pass |

---

## Zero-Knowledge Verification

The following manual test confirmed the server cannot access file plaintext:

1. Upload a test file through the application.
2. Directly query MongoDB — confirm `File` record contains only metadata (no content).
3. Retrieve the `FileKey.wrappedKeyB64` from MongoDB — confirm it is ciphertext (not a usable AES key).
4. Retrieve the ciphertext blob from Dropbox/Google Drive — confirm it is not readable as the original file.
5. Download through the application — confirm the file decrypts correctly only with the browser holding the correct device master key.

**Result:** Server-side inspection cannot recover file content. Zero-knowledge property verified.

---

## Recommended Future Testing

| Type | Tool | Priority |
|------|------|----------|
| Unit tests — crypto functions | Vitest (frontend), Jest (backend) | High |
| Integration tests — API endpoints | Supertest + test MongoDB | High |
| End-to-end tests — upload/download flow | Playwright or Cypress | High |
| Rate limiting validation | k6 or Artillery | Medium |
| Penetration test — OWASP top 10 | OWASP ZAP or Burp Suite | High (pre-production) |
| Audit log chain integrity | Custom verification script | Medium |
| Cross-browser compatibility | BrowserStack | Low |
| Mobile viewport testing | Chrome DevTools device emulation | Low |

---

## Known Test Gaps

| Gap | Risk |
|-----|------|
| No automated regression suite | Manual re-testing required after every change |
| No rate limit tests | Brute-force vulnerability not quantified |
| No adversarial cryptography tests | Malformed IV / truncated ciphertext not exercised |
| No concurrent upload tests | Race conditions in three-phase upload not validated |
| No load testing | Unknown degradation at scale |
