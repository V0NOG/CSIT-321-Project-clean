import mongoose from "mongoose";

const FileKeySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    file:  { type: mongoose.Schema.Types.ObjectId, ref: "File",  required: true },
    keyB64: { type: String, required: true },
    ivB64:  { type: String, required: true },
  },
  { timestamps: true }
);

// Ensure uniqueness per (owner, file)
FileKeySchema.index({ owner: 1, file: 1 }, { unique: true });

export default mongoose.model("FileKey", FileKeySchema, "filekeys");