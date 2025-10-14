// backend/models/Share.js
import mongoose from "mongoose";

const shareSchema = new mongoose.Schema(
  {
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who shared it
    recipientEmail: { type: String, required: true }, // email invite target
    recipientUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },       // set when user signs up / exists
    permission: { type: String, enum: ["viewer", "editor"], default: "viewer" },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Share", shareSchema);