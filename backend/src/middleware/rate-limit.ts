import type { Request } from "express";
import {
  ipKeyGenerator,
  rateLimit,
  type ClientRateLimitInfo,
  type Options,
  type Store,
} from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { ApiError } from "../errors/api-error";
import { redisService } from "../services/redis";

// RedisStore loads a Lua script when the limiter is created, but the Redis client only
// connects later (in main.ts). This wrapper creates the real store on first use instead.
class LazyRedisStore implements Store {
  readonly prefix: string;
  private options?: Options;
  private ready?: Promise<RedisStore>;

  constructor(name: string) {
    this.prefix = `rl:${name}:`;
  }

  init(options: Options) {
    this.options = options;
  }

  private store(): Promise<RedisStore> {
    if (!this.ready) {
      const store = new RedisStore({
        prefix: this.prefix,
        sendCommand: (...args: string[]) =>
          redisService.getClient().sendCommand(args),
      });
      this.ready = store
        .init(this.options as Options)
        .then(() => store)
        .catch((error) => {
          this.ready = undefined; // retry on the next request
          throw error;
        });
    }
    return this.ready;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    return (await this.store()).increment(key);
  }
  async decrement(key: string) {
    return (await this.store()).decrement(key);
  }
  async resetKey(key: string) {
    return (await this.store()).resetKey(key);
  }
}

const createLimiter = (config: {
  name: string;
  windowMs: number;
  limit: number;
  key: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  message?: string;
}) =>
  rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    standardHeaders: "draft-8",
    identifier: config.name,
    legacyHeaders: false,
    store: new LazyRedisStore(config.name),
    keyGenerator: config.key,
    skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
    handler: (_req, _res, next) =>
      next(
        new ApiError({
          code: "TOO_MANY_REQUESTS",
          message:
            config.message ?? "Too many requests. Please try again later.",
        }),
      ),
  });

const MINUTE = 60 * 1000;
const ip = (req: Request) => ipKeyGenerator(req.ip ?? "unknown");
const userOrIp = (req: Request) => req.user?.id ?? ip(req);

// Whole API, per IP.
export const apiLimiter = createLimiter({
  name: "api",
  windowMs: 15 * MINUTE,
  limit: 600,
  key: ip,
});

// Wrong passwords: 10 failures per IP + email per 15 minutes (successful logins don't count).
export const signinLimiter = createLimiter({
  name: "signin",
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  key: (req) =>
    `${ip(req)}:${String(req.body?.email ?? "")
      .trim()
      .toLowerCase()}`,
  message: "Too many sign-in attempts. Please try again in 15 minutes.",
});

// Account creation: 5 per hour per IP.
export const signupLimiter = createLimiter({
  name: "signup",
  windowMs: 60 * MINUTE,
  limit: 5,
  key: ip,
  message: "Too many accounts created from this network. Try again later.",
});

export const refreshLimiter = createLimiter({
  name: "refresh",
  windowMs: 15 * MINUTE,
  limit: 60,
  key: ip,
});

// Every message costs a Gemini call: per user burst + daily quota. Adjust to your budget.
export const messageBurstLimiter = createLimiter({
  name: "msg-burst",
  windowMs: MINUTE,
  limit: 20,
  key: userOrIp,
  message: "You are sending messages too fast. Please slow down.",
});

export const messageDailyLimiter = createLimiter({
  name: "msg-daily",
  windowMs: 24 * 60 * MINUTE,
  limit: 200,
  key: userOrIp,
  message: "Daily message limit reached. Please try again tomorrow.",
});
