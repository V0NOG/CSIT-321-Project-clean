// backend/models/File.js
import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true }, // original plaintext size
    mime: { type: String, default: "application/octet-stream" },
    isSharedCopy: { type: Boolean, default: false },

    // Where the ciphertext lives in Dropbox
    dropboxPath: { type: String }, // e.g. /Apps/MyApp/<userId>/<fileId>.bin

    // Encryption metadata (client-side AES-GCM)
    storage: {
      ivB64: { type: String }, // 12-byte IV, base64
    },

    // Optional status
    status: { type: String, default: "init" }, // init | ready

    // User-created folder (null = root)
    folder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },

    // Which storage connector was used (null = app-level Dropbox)
    connector: { type: mongoose.Schema.Types.ObjectId, ref: "StorageConnector", default: null },
    // Provider-specific file ID (e.g., Google Drive file ID)
    connectorFileId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("File", FileSchema);