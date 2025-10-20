// backend/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, index: true },
    password:  { type: String, required: true },

    phone: { type: String },
    bio:   { type: String },

    address: {
      country:   { type: String },
      cityState: { type: String },
      postalCode:{ type: String },
    },

    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
    },

    // Zero-knowledge crypto (client generates keys)
    pubKey:     { type: String }, // PEM/Base64/JWK public key
    encPrivKey: { type: String }, // encrypted private key blob (never plaintext)

    // MFA (TOTP)
    totpEnabled: { type: Boolean, default: false },
    totpSecretEnc:{ type: String }, // encrypt with TOTP_ENC_KEY

    // session / token hygiene (optional)
    tokenVersion: { type: Number, default: 0 }, // bump to invalidate all refresh tokens
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
