---
id: index
title: Technical Report
sidebar_label: Project Summary
slug: /technical-report
---

# Cipher Cloud — Technical Report

**Subject:** CSIT-321 Capstone Project

---

## Project Summary

Cipher Cloud is our capstone project for encrypted file storage and sharing the main idea is that files are encrypted on the client side before upload, so the backend mainly handles accounts, metadata, sharing records, audit logs, and cloud connector coordination. This made the project more complex than a normal file manager because upload, download, and sharing all needed key handling logic. 

During development the hardest part was balancing usability with the zero knowledge design a normal file manager can send files directly to the server but Cipher Cloud needed extra steps for encryption, key wrapping, cloud upload, and decryption during download. This affected how the frontend, backend, and database were designed some parts such as sharing and account recovery were more difficult than expected because the server cannot simply access the user’s private key this helped us understand why privacy focused systems require careful design beyond just adding encryption.

---

## Iteration History

In practice, the iterations were not perfectly separate. Some features, such as sharing and folder management, had to be revisited after the encryption workflow changed. The most difficult part was making the system usable while still keeping the zero knowledge model clear.

| Iteration | Focus | Key Deliverables |
|-----------|-------|-----------------|
| 1 | Foundation | Express + React scaffolding, JWT auth, user registration and login, MongoDB schema design |
| 2 | Core Encryption | RSA-4096 key generation, AES-256-GCM client-side encryption, file upload/download, Dropbox integration |
| 3 | Sharing & Folders | Zero-knowledge file sharing with key re-wrapping, folder management, Google Drive connector |
| 4 | Polish & Features | TOTP 2FA, analytics dashboard, ACL, OAuth settings, Explorer drag and drop, Swagger docs, bug fixes |

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Node.js | 20+ | Server-side JavaScript runtime |
| API Framework | Express | 5.1.0 | HTTP routing and middleware |
| Database | MongoDB + Mongoose | Atlas + 8.x | Document store for metadata |
| Authentication | jsonwebtoken | 9.0.2 | JWT generation and verification |
| Password Hashing | bcryptjs | 3.0.2 | Password hashing (12 rounds) |
| 2FA | otplib + speakeasy | 12.x + 2.x | TOTP generation and verification |
| Cloud Storage | Dropbox SDK + Google APIs | 10.x | File storage providers |
| HTTP Security | helmet | 8.1.0 | Security header middleware |
| API Docs | swagger-jsdoc + swagger-ui-express | 6.x + 5.x | OpenAPI 3.0 documentation |
| Frontend | React + TypeScript | 19.0.0 + 5.7.2 | UI framework |
| Build Tool | Vite | 6.x | Frontend bundler |
| Routing | React Router | 7.x | Client-side routing |
| Styling | Tailwind CSS | 4.0.8 | Utility-first CSS |
| HTTP Client | Axios | 1.9.0 | API request library |
| Drag and Drop | React DnD | 16.x | File explorer drag-and-drop |
| Charts | ApexCharts | 4.x | Analytics visualisation |

---

## Out of Scope

The following items were not delivered in the current iteration:

- Mobile native application (iOS / Android)
- On-premises or self-hosted storage
- Billing or subscription management
- Admin user management dashboard
- Password reset via email
