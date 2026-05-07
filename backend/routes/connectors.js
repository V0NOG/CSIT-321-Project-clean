// backend/routes/connectors.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  listConnectors,
  deleteConnector,
  startGoogleAuth,
  handleGoogleCallback,
  startDropboxAuth,
  handleDropboxCallback,
  getConnectorConfig,
} from "../controllers/connectorsController.js";

const router = express.Router();

// These callbacks receive browser redirects from Google/Dropbox — no auth middleware
router.get("/google/callback", handleGoogleCallback);
router.get("/dropbox/callback", handleDropboxCallback);

// All other routes require auth
router.use(verifyToken);
router.get("/config", getConnectorConfig);
router.get("/", listConnectors);
router.delete("/:id", deleteConnector);
router.get("/google/auth", startGoogleAuth);
router.get("/dropbox/auth", startDropboxAuth);

export default router;
