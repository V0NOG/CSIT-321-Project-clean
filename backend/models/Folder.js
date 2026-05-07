// backend/models/Folder.js
import mongoose from "mongoose";

const FolderSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 255 },
    color: { type: String, default: "#6B7280" },
  },
  { timestamps: true }
);

FolderSchema.index({ owner: 1, name: 1 }, { unique: true });

export default mongoose.model("Folder", FolderSchema);
