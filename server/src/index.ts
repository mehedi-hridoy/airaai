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

// Middleware
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || "http://localhost:3000",
    "http://localhost:3003",
    "http://localhost:3001",
  ],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/chat", chatRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/tts", ttsRouter);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Aira AI Server running on http://localhost:${PORT}`);
});
