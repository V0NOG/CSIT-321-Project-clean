// backend/routes/keys.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getPublicKey, getMyKeys, rotateKeys } from "../controllers/keysController.js";

const router = express.Router();

router.get("/me", verifyToken, getMyKeys);                // own pubKey + encPrivKey
router.get("/public/:userId", verifyToken, getPublicKey); // someone else's pubKey
router.get("/public", verifyToken, getPublicKey);         // own pubKey
router.post("/rotate", verifyToken, rotateKeys);

export default router;