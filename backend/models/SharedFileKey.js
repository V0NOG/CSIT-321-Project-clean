// backend/models/SharedFileKey.js
// Stores a per-file AES key re-wrapped with the recipient's RSA-OAEP public key.
// The server never sees the plaintext key — true zero-knowledge sharing.
import mongoose from "mongoose";

const SharedFileKeySchema = new mongoose.Schema(
  {
    share: { type: mongoose.Schema.Types.ObjectId, ref: "Share", required: true, index: true },
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    senderUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // File key encrypted with recipient's RSA-OAEP public key, base64-encoded
    wrappedKeyB64: { type: String, required: true },
  },
  { timestamps: true }
);

SharedFileKeySchema.index({ share: 1, recipientUser: 1 }, { unique: true });

export default mongoose.model("SharedFileKey", SharedFileKeySchema);
