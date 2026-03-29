import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import totpRoutes from "./routes/totp.js";
import keysRoutes from "./routes/keys.js";
import fileRoutes from "./routes/files.js";
import aclRoutes from "./routes/acl.js";
import analyticsRoutes from "./routes/analytics.js";
import sharesRouter from "./routes/shares.js";
const app = express();

// --- security & parsing ---
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// --- CORS (frontend origin only) ---
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type"],
  })
);

// simple request log
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

app.get("/", (_req, res) => res.send("API is working"));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/auth/totp", totpRoutes);
app.use("/api/keys", keysRoutes);
app.use("/api/user", userRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/acl", aclRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/shares", sharesRouter);

// central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled Error:", err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, "0.0.0.0", () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));