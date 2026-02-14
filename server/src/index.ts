import dotenv from "dotenv";
// Load environment variables FIRST before any other imports
dotenv.config();

import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat.js";
import { companiesRouter } from "./routes/companies.js";
import ttsRouter from "./routes/tts.js";

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

// Validate required environment variables
const requiredEnvVars = ["GEMINI_API_KEY"];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

// Middleware
const allowedOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:3000",
];

// In development, allow additional origins
if (!isProduction) {
  allowedOrigins.push("http://localhost:3003", "http://localhost:3001");
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// Security headers for production
if (isProduction) {
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });
}

// Health check
app.get("/health", (_, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// Routes
app.use("/api/chat", chatRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/tts", ttsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({ 
    error: isProduction ? "Internal server error" : err.message 
  });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`🚀 Aira AI Server running on http://localhost:${PORT} (${NODE_ENV})`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
