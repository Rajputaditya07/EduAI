import "dotenv/config";
import { validateEnv } from "./config/validateEnv.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

// Fail fast if env vars are missing
validateEnv();

const PORT = process.env.PORT || 8000;

(async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
  });

  // ── Graceful Shutdown (Render sends SIGTERM) ────────────────
  const shutdown = () => {
    console.log("\n🛑  SIGTERM received — shutting down gracefully...");
    server.close(() => {
      console.log("✅  HTTP server closed");
      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      console.error("⚠️  Forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
})();
