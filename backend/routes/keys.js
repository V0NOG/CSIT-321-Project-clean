// backend/routes/keys.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getPublicKey, getMyKeys, rotateKeys } from "../controllers/keysController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Keys
 *   description: >
 *     RSA-4096 key pair management for zero-knowledge encryption.
 *     The server stores only the public key and an AES-GCM encrypted private key.
 *     The server never handles the plaintext private key.
 */

/**
 * @swagger
 * /api/keys/me:
 *   get:
 *     summary: Get own public key and encrypted private key
 *     description: >
 *       Returns both the RSA public key and the client-encrypted private key blob
 *       needed for the client to reconstruct the key pair and decrypt files.
 *     tags: [Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Key pair data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pubKey:
 *                   type: string
 *                   description: RSA-4096 public key (PEM)
 *                   example: "-----BEGIN PUBLIC KEY-----\nMIIBI..."
 *                 encPrivKey:
 *                   type: string
 *                   description: AES-GCM encrypted private key (base64)
 *                   example: "eyJpdiI6Ii4uLiIsImN0IjoiLi4uIn0="
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Keys not yet generated for this user
 */
router.get("/me", verifyToken, getMyKeys);

/**
 * @swagger
 * /api/keys/public/{userId}:
 *   get:
 *     summary: Get another user's public key
 *     description: >
 *       Retrieves the RSA public key of any registered user by their ID.
 *       Used by the file owner to wrap the file's AES key for a share recipient.
 *     tags: [Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the target user
 *         example: 64b1c2d3e4f5a6b7c8d9e0f1
 *     responses:
 *       200:
 *         description: Target user's public key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pubKey:
 *                   type: string
 *                   example: "-----BEGIN PUBLIC KEY-----\nMIIBI..."
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found or has no public key
 */
router.get("/public/:userId", verifyToken, getPublicKey);

/**
 * @swagger
 * /api/keys/public:
 *   get:
 *     summary: Get own public key (short form)
 *     tags: [Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Own RSA public key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pubKey:
 *                   type: string
 *                   example: "-----BEGIN PUBLIC KEY-----\nMIIBI..."
 *       401:
 *         description: Unauthorized
 */
router.get("/public", verifyToken, getPublicKey);

/**
 * @swagger
 * /api/keys/rotate:
 *   post:
 *     summary: Rotate the RSA key pair
 *     description: >
 *       Generates a new RSA-4096 key pair for the user. The client must
 *       re-wrap all existing file keys with the new public key after rotation.
 *       The new encrypted private key is saved; the old pair is discarded.
 *     tags: [Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pubKey, encPrivKey]
 *             properties:
 *               pubKey:
 *                 type: string
 *                 description: New RSA-4096 public key (PEM)
 *               encPrivKey:
 *                 type: string
 *                 description: New private key encrypted by the client (base64)
 *     responses:
 *       200:
 *         description: Key rotation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Keys rotated
 *       400:
 *         description: Missing pubKey or encPrivKey
 *       401:
 *         description: Unauthorized
 */
router.post("/rotate", verifyToken, rotateKeys);

export default router;
