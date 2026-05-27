// backend/routes/connectors.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  listConnectors,
  deleteConnector,
  startGoogleAuth,
  handleGoogleCallback,
  startDropboxAuth,
  handleDropboxCallback,
  getConnectorConfig,
} from "../controllers/connectorsController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Connectors
 *   description: >
 *     Cloud storage connector management. Connects Dropbox or Google Drive
 *     accounts via OAuth 2.0. OAuth tokens are stored AES-GCM encrypted.
 */

// OAuth callbacks do not use auth middleware — they receive browser redirects
/**
 * @swagger
 * /api/connectors/google/callback:
 *   get:
 *     summary: Google Drive OAuth 2.0 callback (browser redirect)
 *     description: >
 *       Receives the authorisation code from Google after the user grants
 *       permission. Exchanges it for access/refresh tokens, encrypts and
 *       stores them, then redirects to the frontend connectors page.
 *       This endpoint is called by Google, not the client application.
 *     tags: [Connectors]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth authorisation code from Google
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for CSRF protection
 *     responses:
 *       302:
 *         description: Redirect to frontend after token exchange
 *       400:
 *         description: Missing or invalid code
 *       500:
 *         description: Token exchange failed
 */
router.get("/google/callback", handleGoogleCallback);

/**
 * @swagger
 * /api/connectors/dropbox/callback:
 *   get:
 *     summary: Dropbox OAuth 2.0 callback (browser redirect)
 *     description: >
 *       Receives the authorisation code from Dropbox after the user grants
 *       permission. Exchanges it for access/refresh tokens, encrypts and
 *       stores them, then redirects to the frontend connectors page.
 *     tags: [Connectors]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to frontend
 *       400:
 *         description: Missing code
 */
router.get("/dropbox/callback", handleDropboxCallback);

// All routes below require JWT authentication
router.use(verifyToken);

/**
 * @swagger
 * /api/connectors/config:
 *   get:
 *     summary: Get OAuth client configuration for supported providers
 *     description: >
 *       Returns the OAuth client IDs needed by the frontend to build the
 *       authorisation URLs. Never returns client secrets.
 *     tags: [Connectors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth client configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 google:
 *                   type: object
 *                   properties:
 *                     clientId:
 *                       type: string
 *                 dropbox:
 *                   type: object
 *                   properties:
 *                     appKey:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/config", getConnectorConfig);

/**
 * @swagger
 * /api/connectors:
 *   get:
 *     summary: List all cloud storage connectors for the current user
 *     tags: [Connectors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of connected storage providers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connectors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StorageConnector'
 *       401:
 *         description: Unauthorized
 */
router.get("/", listConnectors);

/**
 * @swagger
 * /api/connectors/{id}:
 *   delete:
 *     summary: Disconnect and remove a cloud storage connector
 *     description: Removes the connector and deletes the stored encrypted OAuth tokens.
 *     tags: [Connectors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: StorageConnector ID
 *     responses:
 *       200:
 *         description: Connector disconnected
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Connector not found
 */
router.delete("/:id", deleteConnector);

/**
 * @swagger
 * /api/connectors/google/auth:
 *   get:
 *     summary: Initiate Google Drive OAuth 2.0 authorisation flow
 *     description: >
 *       Returns a Google OAuth authorisation URL that the client should redirect
 *       the user to. After authorisation, Google redirects to /google/callback.
 *     tags: [Connectors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth authorisation URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authUrl:
 *                   type: string
 *                   description: URL to redirect the user to
 *                   example: "https://accounts.google.com/o/oauth2/v2/auth?..."
 *       401:
 *         description: Unauthorized
 */
router.get("/google/auth", startGoogleAuth);

/**
 * @swagger
 * /api/connectors/dropbox/auth:
 *   get:
 *     summary: Initiate Dropbox OAuth 2.0 authorisation flow
 *     description: Returns a Dropbox OAuth URL that the client should redirect the user to.
 *     tags: [Connectors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth authorisation URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authUrl:
 *                   type: string
 *                   example: "https://www.dropbox.com/oauth2/authorize?..."
 *       401:
 *         description: Unauthorized
 */
router.get("/dropbox/auth", startDropboxAuth);

export default router;
