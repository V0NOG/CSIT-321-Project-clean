// backend/models/File.js
import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    mime: { type: String },
    size: { type: Number, default: 0 },
    isSharedCopy: { type: Boolean, default: false },
    // any other fields you already had (path, encryption, etc.)
  },
  { timestamps: true }
);

// Export default, but we will *import it as FileModel* to avoid name clash
export default mongoose.model("File", fileSchema);