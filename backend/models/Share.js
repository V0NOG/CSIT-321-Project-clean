// backend/models/Share.js
import mongoose from "mongoose";

const shareSchema = new mongoose.Schema(
  {
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    targetEmail: { type: String, lowercase: true, trim: true },
    permission: { type: String, enum: ["viewer", "editor"], default: "viewer" },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    note: { type: String, maxlength: 500 },
    // whether the owner re-wrapped the file key for this recipient (ZK sharing)
    keyProvided: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Share", shareSchema);