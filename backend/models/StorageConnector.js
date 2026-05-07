// backend/models/StorageConnector.js
// Stores OAuth tokens (encrypted at rest) for user-connected cloud storage providers.
import mongoose from "mongoose";

const StorageConnectorSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: {
      type: String,
      enum: ["dropbox", "google_drive"],
      required: true,
    },
    name: { type: String, trim: true, maxlength: 100 },
    // AES-GCM encrypted JSON blob: { accessToken, refreshToken, expiresAt, ... }
    encTokens: { type: String, required: true },
    // Provider-specific user info (email, display name) for the UI — not sensitive
    providerEmail: { type: String },
    providerName: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("StorageConnector", StorageConnectorSchema);
