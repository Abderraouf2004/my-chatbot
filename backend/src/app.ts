import express from "express";
import router from "./apis";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { apiLimiter } from "./middleware/rate-limit";
import { errorHandler } from "./errors/error-handler";
import { notFoundHandler } from "./errors/not-found";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "Idempotency-Key",
    ],
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "32kb" }));

app.use("/api", apiLimiter, router);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
