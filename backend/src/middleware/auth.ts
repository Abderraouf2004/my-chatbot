import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api-error";
import { tokenService } from "../services/token";
import { redisService } from "../services/redis";
import { getBearerToken } from "../services/auth-header";

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"] as string;
  const token = getBearerToken(authHeader);

  // const payload = tokenService.verifyToken(token, false);
  const payload = tokenService.verifyToken(token, "access");
  const redis = redisService.getClient();

  const key = `blacklist:${token}`;
  const isBlacklisted = await redis.get(key);

  if (isBlacklisted) {
    throw new ApiError({
      code: "UNAUTHORIZED",
      message: "Token revoked",
      details: "This token has been revoked. Please sign in again.",
    });
  }

  req.user = {
    id: payload.id,
  };

  req.token = token;

  next();
};
