---
id: index
title: Marketing and Product
sidebar_label: Marketing
slug: /marketing
---

# Cipher Cloud Marketing and Product

**Product:** Cipher Cloud - zero-knowledge encrypted file storage  
**Project:** CSIT-321 Capstone Project  
**Audience:** Evaluators, stakeholders, privacy-conscious users, and small professional teams  
**Positioning line:** Your files are encrypted before they leave your browser.

---

## Executive Summary

Cipher Cloud is positioned as a professional privacy layer for everyday cloud storage. It does not ask users to abandon Dropbox or Google Drive. Instead, it encrypts files in the browser before upload, stores only ciphertext in the connected cloud provider, and supports secure sharing through client-side key re-wrapping.

The product is marketed as a practical bridge between consumer cloud convenience and professional-grade privacy. Its main value is not only encryption, but usability: familiar file management, folders, drag and drop organisation, account security, audit events, and documentation that explains the security model clearly.

---

## Target Market

### Primary Segments

| Segment | Need | Cipher Cloud Fit |
|---------|------|------------------|
| Privacy-conscious individuals | Private storage for personal documents, IDs, records, and confidential files. | Browser-side encryption plus familiar cloud storage. |
| Small legal, medical, finance, and consulting practices | Controlled sharing and auditability without enterprise storage pricing. | Access control, 2FA, audit events, and tamper-evident logging. |
| Security-aware students and developers | A transparent, inspectable implementation of zero-knowledge storage. | Standards-based cryptography and clear technical documentation. |
| Remote project teams | Share sensitive files across devices and locations. | Encrypted sharing and cloud-provider flexibility. |

### Buyer and User Motivations

- Reduce trust placed in commercial cloud providers.
- Keep using existing Dropbox or Google Drive storage.
- Share files without emailing attachments or exposing plaintext.
- Demonstrate security thinking in a capstone, portfolio, or stakeholder presentation.
- Understand how practical zero-knowledge architecture works.

---

## Product Positioning

**Positioning statement:**  
For privacy conscious users and small teams who store sensitive files in the cloud, Cipher Cloud is a zero-knowledge file management platform that encrypts files in the browser before upload, so neither the application server nor the cloud provider can read file content.

### Core Value Proposition

Cipher Cloud gives users cloud storage they can verify. It combines browser-side encryption, user owned cloud storage, secure sharing, and audit logging in one professional file management experience.

### Key Messages

| Message | Proof |
|---------|-------|
| Your files are private by design. | Encryption and decryption happen in the browser before files reach the server. |
| You can keep the cloud you already use. | Dropbox and Google Drive connectors store encrypted file blobs. |
| Sharing does not break privacy. | File keys are re-wrapped for recipients using their public key. |
| The system is professional and auditable. | TOTP, ACLs, audit logs, analytics, and Swagger/OpenAPI documentation are included. |

---

## Design Methodology

Cipher Cloud follows a user-centred, iterative, privacy-by-design methodology.

| Method | Application in Cipher Cloud |
|--------|-----------------------------|
| User-centred design | File workflows use familiar patterns: folders, search, drag-and-drop, download, share, and profile settings. |
| Progressive disclosure | Core actions are easy to reach, while advanced controls such as 2FA, connectors, and permissions remain available when needed. |
| Privacy by design | The zero-knowledge model is built into the upload, download, and sharing workflows rather than added later as a feature. |
| Iterative delivery | Four implementation iterations delivered foundation, encryption, sharing/organisation, and final polish. |
| Responsive product design | The interface uses modern dashboard conventions, dark/light modes, cards, tables, badges, and analytics visualisation. |
| Transparency | Documentation explains architecture, algorithms, deployment, limitations, and user workflows. |

### Current Design Trends Used

- Privacy-first SaaS positioning with proof-based trust messaging.
- Clean dashboard information architecture.
- Dark mode support for modern professional interfaces.
- Responsive layouts for desktop and mobile browsers.
- Data visualisation through analytics charts.
- Secure-by-default onboarding through account setup, connectors, and optional TOTP.
- Documentation-led credibility using Docusaurus, OpenAPI, and structured user manuals.

---

## Development Environments

| Category | Tools and Environment | Purpose |
|----------|-----------------------|---------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 | Build the responsive dashboard, file explorer, forms, and client-side workflows. |
| Backend | Node.js 20, Express 5, Mongoose 8 | Provide API routes, authentication, metadata, audit logs, and connector orchestration. |
| Database | MongoDB Atlas | Store users, metadata, wrapped keys, sessions, folders, shares, settings, and audit records. |
| Cryptography | Browser Web Cryptography API, AES-256-GCM, RSA-4096 | Encrypt files client-side and protect file keys. |
| Cloud providers | Dropbox SDK, Google APIs | Store encrypted file blobs in user-authorised cloud accounts. |
| Security | bcrypt, JWT, HttpOnly cookies, Helmet, TOTP | Protect accounts, sessions, credentials, and HTTP surface area. |
| Documentation | Docusaurus, Markdown, Mermaid, Swagger/OpenAPI | Present user manuals, technical reports, deployment guides, API documentation, and marketing content. |
| Collaboration | Git/GitHub, VS Code, ESLint, TypeScript checks | Support source control, code quality, and maintainable development. |

---

## Product Benefits

| Feature | User Benefit |
|---------|--------------|
| Client-side AES-256-GCM encryption | Files are unreadable before they leave the browser. |
| RSA-4096 file key wrapping | File keys are protected for each authorised user. |
| Dropbox and Google Drive support | Users do not need a new storage subscription. |
| Zero-knowledge sharing | Recipients can decrypt shared files without exposing keys to the server. |
| TOTP two-factor authentication | A stolen password alone is not enough to access the account. |
| Tamper-evident audit log | Security events can be reviewed and tampering can be detected. |
| Analytics dashboard | Users can understand storage usage and activity. |
| Swagger API documentation | Evaluators and developers can inspect the backend contract. |

---

## Roadmap Messaging

| Roadmap Item | Marketing Framing |
|--------------|-------------------|
| Google Drive listing | Deeper provider integration for a more complete multi-cloud experience. |
| Password reset | Improved account recovery for production deployment. |
| Admin dashboard | Organisation management for teams and institutions. |
| Native mobile apps | Dedicated encrypted file workflows on iOS and Android. |
| Additional connectors | Expansion beyond Dropbox and Google Drive. |

---

## Final Assessment

Cipher Cloud is marketable because it explains a complex security model through a simple promise: files are encrypted before they leave the browser.
