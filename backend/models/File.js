// backend/models/File.js
import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    mime: { type: String, default: "application/octet-stream", index: true },

    // GridFS reference (where the ciphertext lives)
    storage: {
      gridFsId: { type: mongoose.Schema.Types.ObjectId, index: true },
      length: { type: Number },
      filename: { type: String },
    },
  },
  { timestamps: true }
);

// Handy virtual to know if it's uploaded
fileSchema.virtual("uploaded").get(function () {
  return !!this.storage?.gridFsId;
});

export default mongoose.model("File", fileSchema);