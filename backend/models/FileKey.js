// backend/models/FileKey.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const FileKeySchema = new Schema(
  {
    file: { type: Schema.Types.ObjectId, ref: "File", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    wrappedKeyB64: { type: String, required: true }, // base64 of wrapped key
  },
  { timestamps: true }
);

FileKeySchema.index({ file: 1, owner: 1 }, { unique: true });

export default mongoose.model("FileKey", FileKeySchema);