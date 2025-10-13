// backend/routes/analytics.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { summary } from "../controllers/analyticsController.js";

const router = express.Router();
router.get("/summary", verifyToken, summary);

export default router;