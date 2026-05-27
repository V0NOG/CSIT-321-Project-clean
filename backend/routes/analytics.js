// backend/routes/analytics.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { summary } from "../controllers/analyticsController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Usage statistics and storage analytics for the authenticated user
 */

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     summary: Get the current user's usage analytics summary
 *     description: >
 *       Returns aggregated statistics including total storage used, file counts
 *       by type, active session count, recent upload activity, and share counts.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalFiles:
 *                   type: integer
 *                   description: Total number of files owned by the user
 *                   example: 42
 *                 totalStorageBytes:
 *                   type: integer
 *                   description: Total storage used in bytes
 *                   example: 104857600
 *                 filesByType:
 *                   type: object
 *                   description: File count grouped by MIME type category
 *                   example: { "image": 15, "document": 20, "video": 5, "other": 2 }
 *                 activeSessions:
 *                   type: integer
 *                   description: Number of active login sessions
 *                   example: 2
 *                 sharedByMe:
 *                   type: integer
 *                   description: Number of files the user has shared with others
 *                   example: 8
 *                 sharedWithMe:
 *                   type: integer
 *                   description: Number of files shared with the user (accepted)
 *                   example: 3
 *                 recentUploads:
 *                   type: array
 *                   description: Last 5 uploaded files
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       size:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to generate analytics
 */
router.get("/summary", verifyToken, summary);

export default router;
