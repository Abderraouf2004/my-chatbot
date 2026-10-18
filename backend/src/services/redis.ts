import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL ?? "";

if (!REDIS_URL) {
  throw new Error("REDIS_URL is not defined");
}

class RedisService {
  private static instance: RedisService;
  private client;

  private constructor() {
    this.client = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 5000,
      },
    });

    this.client.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }

    return RedisService.instance;
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  getClient() {
    return this.client;
  }
}

export const redisService = RedisService.getInstance();
