import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cipher Cloud API",
      version: "1.0.0",
      description:
        "Zero-knowledge encrypted file storage and sharing platform. All file content is encrypted client-side before upload; the server never handles plaintext or private keys.",
      contact: {
        name: "CSIT-321 Project Team",
      },
    },
    servers: [
      {
        url: "http://localhost:5050",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token from /api/auth/login",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "HttpOnly cookie set automatically on login",
        },
      },
      schemas: {
        // ── User ────────────────────────────────────────────────────────────
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64b1c2d3e4f5a6b7c8d9e0f1" },
            firstName: { type: "string", example: "Alice" },
            lastName: { type: "string", example: "Smith" },
            email: { type: "string", format: "email", example: "alice@example.com" },
            phone: { type: "string", example: "+61400000000" },
            bio: { type: "string", example: "Security enthusiast" },
            address: {
              type: "object",
              properties: {
                country: { type: "string" },
                cityState: { type: "string" },
                postalCode: { type: "string" },
              },
            },
            role: { type: "string", enum: ["admin", "staff"], example: "staff" },
            pubKey: {
              type: "string",
              description: "RSA-4096 public key (PEM or Base64)",
              example: "-----BEGIN PUBLIC KEY-----\n...",
            },
            totpEnabled: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        // ── File ────────────────────────────────────────────────────────────
        File: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64b1c2d3e4f5a6b7c8d9e0f2" },
            owner: { type: "string", description: "User ID of file owner" },
            name: { type: "string", example: "report.pdf" },
            size: { type: "integer", description: "Original plaintext size in bytes", example: 204800 },
            mime: { type: "string", example: "application/pdf" },
            isSharedCopy: { type: "boolean", example: false },
            status: { type: "string", enum: ["init", "ready"], example: "ready" },
            folder: { type: "string", description: "Folder ID (nullable)" },
            connector: { type: "string", description: "StorageConnector ID" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        // ── Folder ──────────────────────────────────────────────────────────
        Folder: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64b1c2d3e4f5a6b7c8d9e0f3" },
            owner: { type: "string" },
            name: { type: "string", example: "Work Documents" },
            color: { type: "string", example: "#6B7280" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── Share ────────────────────────────────────────────────────────────
        Share: {
          type: "object",
          properties: {
            _id: { type: "string" },
            file: { type: "string", description: "File ID" },
            owner: { type: "string", description: "Sharing user ID" },
            targetUser: { type: "string", description: "Recipient user ID" },
            targetEmail: { type: "string", format: "email", description: "Recipient email (external invite)" },
            permission: { type: "string", enum: ["viewer", "editor"], example: "viewer" },
            status: { type: "string", enum: ["pending", "accepted", "declined"], example: "pending" },
            note: { type: "string", maxLength: 500 },
            keyProvided: { type: "boolean", description: "Whether ZK key has been wrapped for recipient" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── StorageConnector ────────────────────────────────────────────────
        StorageConnector: {
          type: "object",
          properties: {
            _id: { type: "string" },
            owner: { type: "string" },
            provider: { type: "string", enum: ["dropbox", "google_drive"] },
            name: { type: "string", example: "My Google Drive" },
            providerEmail: { type: "string", format: "email" },
            providerName: { type: "string" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── Error ────────────────────────────────────────────────────────────
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Unauthorized" },
          },
        },
        // ── Pagination metadata ──────────────────────────────────────────────
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 42 },
            pages: { type: "integer", example: 3 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
