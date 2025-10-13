// backend/routes/keys.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getPublicKey, rotateKeys } from "../controllers/keysController.js";

const router = express.Router();

router.get("/public/:userId", verifyToken, getPublicKey); // fetch someone else's pubKey
router.get("/public", verifyToken, getPublicKey);         // or your own
router.post("/rotate", verifyToken, rotateKeys);

export default router;