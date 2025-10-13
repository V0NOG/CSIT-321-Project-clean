// backend/models/AuditLog.js
import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    ts: { type: Date, default: Date.now },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true }, // login|upload|download|share|revoke|...
    target: { type: String },                 // e.g., fileId or shareId
    meta:   { type: Object },

    prevHash: { type: String }, // hex
    hash:     { type: String }, // hex
  },
  { timestamps: false }
);

export default mongoose.model("AuditLog", auditSchema);