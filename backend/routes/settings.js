import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getOAuthSettings, saveOAuthSettings } from "../controllers/settingsController.js";

const router = express.Router();
router.use(verifyToken);
router.get("/oauth", getOAuthSettings);
router.put("/oauth", saveOAuthSettings);

export default router;
