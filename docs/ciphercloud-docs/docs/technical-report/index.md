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

Cipher Cloud is a zero knowledge encrypted file storage and sharing platform. Users store files in personal cloud accounts (Dropbox, Google Drive) with all file content encrypted client-side before it leaves the browser. The server never handles plaintext file content or unprotected private keys.

---

## Iteration History

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
