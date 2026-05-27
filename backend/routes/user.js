// backend/routes/user.js
import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile management
 */

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get the current authenticated user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile (sensitive fields excluded)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -totpSecretEnc -encPrivKey");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

/**
 * @swagger
 * /api/user/me:
 *   put:
 *     summary: Update the current user's profile
 *     description: >
 *       Updates safe profile fields. The following fields are stripped from the
 *       request body and cannot be changed via this endpoint: role, password,
 *       totpSecretEnc, encPrivKey.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Alice
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               phone:
 *                 type: string
 *                 example: "+61400000000"
 *               bio:
 *                 type: string
 *                 example: Security enthusiast
 *               address:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                   cityState:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Update failed
 */
router.put("/me", verifyToken, async (req, res) => {
  try {
    const { role, password, totpSecretEnc, encPrivKey, ...rest } = req.body || {};
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: rest },
      { new: true }
    ).select("-password -totpSecretEnc -encPrivKey");
    res.json(updated);
  } catch (err) {
    console.error("PUT /me error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/**
 * @swagger
 * /api/user/mfa:
 *   get:
 *     summary: Get the current user's MFA (TOTP) enabled status
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totpEnabled:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/mfa", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("totpEnabled");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ totpEnabled: !!user.totpEnabled });
  } catch (err) {
    console.error("GET /mfa error:", err);
    res.status(500).json({ error: "Failed to fetch MFA status" });
  }
});

export default router;
