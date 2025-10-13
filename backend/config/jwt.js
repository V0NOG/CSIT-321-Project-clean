// backend/config/jwt.js
import dotenv from "dotenv";
dotenv.config();

export const JWT_SECRET = (process.env.JWT_SECRET || "").trim();

if (!JWT_SECRET) {
  // Fail fast during boot if missing
  console.error("[JWT] Missing JWT_SECRET in environment");
}