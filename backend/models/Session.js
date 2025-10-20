// backend/models/Session.js
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    refreshJti: { type: String, unique: true, index: true }, // JWT ID
    ua: String,
    ip: String,
    revoked: { type: Boolean, default: false },
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);