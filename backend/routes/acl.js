// backend/routes/acl.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getAcl, upsertAcl, removeAcl } from "../controllers/aclController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ACL
 *   description: Access Control List management for fine-grained file permissions
 */

/**
 * @swagger
 * /api/acl/{id}:
 *   get:
 *     summary: Get the ACL for a file or resource
 *     description: Returns all ACL entries for the given resource ID.
 *     tags: [ACL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File or resource ID
 *     responses:
 *       200:
 *         description: ACL entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 acl:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       keyId:
 *                         type: string
 *                         description: User ID or key identifier
 *                       permission:
 *                         type: string
 *                         enum: [viewer, editor]
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Resource not found
 */
router.get("/:id", verifyToken, getAcl);

/**
 * @swagger
 * /api/acl/{id}:
 *   post:
 *     summary: Create or update an ACL entry (upsert)
 *     tags: [ACL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File or resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [keyId, permission]
 *             properties:
 *               keyId:
 *                 type: string
 *                 description: User ID or key identifier to grant access to
 *               permission:
 *                 type: string
 *                 enum: [viewer, editor]
 *                 example: viewer
 *     responses:
 *       200:
 *         description: ACL entry created or updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the resource owner
 */
router.post("/:id", verifyToken, upsertAcl);

/**
 * @swagger
 * /api/acl/{id}/{keyId}:
 *   delete:
 *     summary: Remove an ACL entry
 *     tags: [ACL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File or resource ID
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID or key identifier to remove
 *     responses:
 *       200:
 *         description: ACL entry removed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: ACL entry not found
 */
router.delete("/:id/:keyId", verifyToken, removeAcl);

export default router;
