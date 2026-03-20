import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

const app = express();

// ── CORS (Must be very first to handle preflight OPTIONS) ───────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:8080",
    credentials: true,
  })
);

// ── Security Headers ────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));

// ── Request Logging ─────────────────────────────────────────────
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

// ── Global Rate Limiter ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ── Core Middleware ─────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ── Stricter Auth Rate Limiter ──────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Health Check ────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dbStatus: dbStates[mongoose.connection.readyState] || "unknown",
  });
});

// ── Route Imports ───────────────────────────────────────────────
import authRoutes from "./modules/auth/auth.routes.js";
import classroomRoutes from "./modules/classrooms/classroom.routes.js";
import assignmentRoutes from "./modules/assignments/assignment.routes.js";
import submissionRoutes from "./modules/submissions/submission.routes.js";
import analyticsRoutes from "./modules/submissions/analytics.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import gradingRoutes from "./modules/ai-grading/grading.routes.js";

// ── Apply auth limiter to login/register ────────────────────────
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ── Mount Routes ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions/analytics", analyticsRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/grading", gradingRoutes);

// ── Global Error Handler (must be last) ─────────────────────────
import { errorHandler } from "./middleware/error.middleware.js";
app.use(errorHandler);

export default app;
