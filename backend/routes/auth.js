import express from "express";
import { register, login, googleLogin } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";
import { JWT_SECRET } from "../config/jwt.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration, login, and OAuth
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Alice
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alice@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: S3cur3P@ssword
 *     responses:
 *       201:
 *         description: Account created. RSA key pair generated server-side on first login.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 userId:
 *                   type: string
 *       400:
 *         description: Validation error or email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password (optionally with TOTP code)
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alice@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: S3cur3P@ssword
 *               totpCode:
 *                 type: string
 *                 description: 6-digit TOTP code (required when 2FA is enabled)
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Authenticated. Access token returned in body and httpOnly cookie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Short-lived JWT (55 min)
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid email/password or incorrect TOTP code
 *       500:
 *         description: Internal server error
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Authenticate with a Google ID token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credential]
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Google One-Tap ID token (JWT from Google)
 *                 example: eyJhbGciOiJSUzI1NiIs...
 *     responses:
 *       200:
 *         description: Authenticated via Google. Access token returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing or invalid Google credential
 *       401:
 *         description: Google token verification failed
 */
router.post("/google", express.json(), googleLogin);

/**
 * @swagger
 * /api/auth/debug/decode:
 *   get:
 *     summary: Decode a JWT without signature verification (debug only)
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer eyJhbGci...
 *     responses:
 *       200:
 *         description: Decoded header and payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 header:
 *                   type: object
 *                 payload:
 *                   type: object
 *                 haveSecret:
 *                   type: boolean
 *       400:
 *         description: No token provided or malformed JWT
 */
router.get("/debug/decode", (req, res) => {
  const auth = req.headers.authorization || "";
  const tok = auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  if (!tok) return res.status(400).json({ error: "No token" });
  try {
    const [h, p] = tok.split(".");
    const header = JSON.parse(Buffer.from(h, "base64url").toString());
    const payload = JSON.parse(Buffer.from(p, "base64url").toString());
    return res.json({ header, payload, haveSecret: Boolean(JWT_SECRET) });
  } catch (e) {
    return res.status(400).json({ error: "Malformed token" });
  }
});

/**
 * @swagger
 * /api/auth/debug/whoami:
 *   get:
 *     summary: Verify token and return decoded claims (debug only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Decoded token claims from the verified token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 decoded:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     role:
 *                       type: string
 *                 secretLen:
 *                   type: integer
 *       401:
 *         description: Missing or invalid token
 */
router.get("/debug/whoami", verifyToken, (req, res) => {
  return res.json({ decoded: req.user, secretLen: (JWT_SECRET || "").length });
});

export default router;
