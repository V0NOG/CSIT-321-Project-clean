import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    bio: { type: String },
    address: {
      country: { type: String },
      cityState: { type: String },
      postalCode: { type: String },
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);