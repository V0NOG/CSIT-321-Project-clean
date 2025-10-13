// backend/models/File.js
import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true }, // original plaintext size
    mime: { type: String, default: "application/octet-stream" },

    // Where the ciphertext lives in Dropbox
    dropboxPath: { type: String }, // e.g. /Apps/MyApp/<userId>/<fileId>.bin

    // Encryption metadata (client-side AES-GCM)
    storage: {
      ivB64: { type: String }, // 12-byte IV, base64
    },

    // Optional status
    status: { type: String, default: "init" }, // init | ready
  },
  { timestamps: true }
);

export default mongoose.model("File", FileSchema);