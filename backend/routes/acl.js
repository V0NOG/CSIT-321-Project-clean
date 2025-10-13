// backend/routes/acl.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getAcl, upsertAcl, removeAcl } from "../controllers/aclController.js";

const router = express.Router();

router.get("/:id", verifyToken, getAcl);
router.post("/:id", verifyToken, upsertAcl);
router.delete("/:id/:keyId", verifyToken, removeAcl);

export default router;