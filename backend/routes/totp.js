// backend/routes/totp.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { totpSetup, totpEnable, totpDisable } from "../controllers/totpController.js";

const router = express.Router();

router.post("/setup", verifyToken, totpSetup);
router.post("/enable", verifyToken, totpEnable);
router.post("/disable", verifyToken, totpDisable);

export default router;