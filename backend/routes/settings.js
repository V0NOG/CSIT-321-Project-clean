import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getOAuthSettings, saveOAuthSettings } from "../controllers/settingsController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Application OAuth configuration settings (admin use)
 */

router.use(verifyToken);

/**
 * @swagger
 * /api/settings/oauth:
 *   get:
 *     summary: Get OAuth provider settings
 *     description: Returns stored OAuth client credentials for configured providers.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 googleClientId:
 *                   type: string
 *                 googleClientSecret:
 *                   type: string
 *                 dropboxAppKey:
 *                   type: string
 *                 dropboxAppSecret:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/oauth", getOAuthSettings);

/**
 * @swagger
 * /api/settings/oauth:
 *   put:
 *     summary: Save OAuth provider settings
 *     description: Persists OAuth client credentials in the AppSettings collection.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               googleClientId:
 *                 type: string
 *               googleClientSecret:
 *                 type: string
 *               dropboxAppKey:
 *                 type: string
 *               dropboxAppSecret:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settings saved
 *       401:
 *         description: Unauthorized
 */
router.put("/oauth", saveOAuthSettings);

export default router;
