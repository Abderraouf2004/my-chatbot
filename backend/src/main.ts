import express from "express";
import router from "./apis";
import { redisService } from "./services/redis";

const app = express();
app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.use("/api", router);
let server: ReturnType<typeof app.listen>;

async function startServer() {
  await redisService.connect();
  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
