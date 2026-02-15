import app from "./index.js";

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

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
