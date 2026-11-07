// import express from "express";
// import router from "./apis";
// import { redisService } from "./services/redis";
// import cors from "cors";
// import helmet from "helmet";
// import cookieParser from "cookie-parser";
// import { apiLimiter } from "./middleware/rate-limit";
// import { errorHandler } from "./errors/error-handler";
// import { notFoundHandler } from "./errors/not-found";
// const app = express();
// app.set("trust proxy", 1);
// app.use(
//   helmet({
//     crossOriginResourcePolicy: { policy: "cross-origin" },
//   }),
// );
// app.use((req, res, next) => {
//   res.setHeader("Cache-Control", "no-store");
//   next();
// });
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL,
//     credentials: true,
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "X-CSRF-Token",
//       "Idempotency-Key",
//     ],
//   }),
// );
// app.use(cookieParser());
// app.use(express.json({ limit: "32kb" }));
// const PORT = process.env.PORT || 3000;
// app.use("/api", apiLimiter, router);

// app.use(notFoundHandler);
// app.use(errorHandler);
// let server: ReturnType<typeof app.listen>;

// async function startServer() {
//   await redisService.connect();
//   server = app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });
// }

// startServer().catch((error) => {
//   console.error("Failed to start server:", error);
//   process.exit(1);
// });

// let isShuttingDown = false;

// async function gracefulShutdown(signal: string) {
//   if (isShuttingDown) return;
//   isShuttingDown = true;

//   console.log(`${signal} received. Starting graceful shutdown...`);

//   server.close(async (error) => {
//     console.log("HTTP server closed.");

//     if (error) {
//       console.error("Error closing HTTP server:", error);
//       process.exitCode = 1;
//     }

//     try {
//       console.log("Closing Redis connection...");
//       await redisService.disconnect();
//       console.log("Redis connection closed.");
//     } catch (error) {
//       console.error("Error closing Redis:", error);
//       process.exitCode = 1;
//     }
//   });
//   server.closeIdleConnections?.();
// }

// process.on("SIGINT", () => gracefulShutdown("SIGINT"));
// process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

import app from "./app";
import { redisService } from "./services/redis";

const PORT = process.env.PORT || 3000;

let server: ReturnType<typeof app.listen>;
let isShuttingDown = false;

async function startServer() {
  await redisService.connect();

  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

async function gracefulShutdown(signal: string) {
  if (isShuttingDown || !server) return;

  isShuttingDown = true;

  console.log(`${signal} received. Starting graceful shutdown...`);

  server.close(async (error) => {
    console.log("HTTP server closed.");

    if (error) {
      console.error("Error closing HTTP server:", error);
      process.exitCode = 1;
    }

    try {
      console.log("Closing Redis connection...");
      await redisService.disconnect();
      console.log("Redis connection closed.");
    } catch (error) {
      console.error("Error closing Redis:", error);
      process.exitCode = 1;
    }
  });

  server.closeIdleConnections?.();
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
