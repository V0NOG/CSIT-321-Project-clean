// backend/models/FileKey.js
import mongoose from "mongoose";

const fileKeySchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File", index: true, required: true },
    // Recipient can be internal user or external email (optional extension)
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    externalEmail: { type: String },
    // wrapped symmetric fileKey (e.g., RSA-OAEP/JWE) — opaque to server
    wrappedFileKey: { type: String, required: true },
    role: { type: String, enum: ["owner", "writer", "reader"], default: "reader" },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// one recipient per file (either recipientId or externalEmail)
fileKeySchema.index({ fileId: 1, recipientId: 1 }, { unique: true, sparse: true });
fileKeySchema.index({ fileId: 1, externalEmail: 1 }, { unique: true, sparse: true });

export default mongoose.model("FileKey", fileKeySchema);