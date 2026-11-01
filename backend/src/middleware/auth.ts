import type { NextFunction, Request, Response } from "express";
import { requireToken } from "../services/auth-header";
import { tokenService } from "../services/token";
import { redisService } from "../services/redis";
import { ApiError } from "../errors/api-error";

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = requireToken(req.cookies?.accessToken);

  const payload = tokenService.verifyToken(token, "access");

  const redis = redisService.getClient();

  const isBlacklisted = await redis.get(`blacklist:${token}`);

  if (isBlacklisted) {
    throw new ApiError({
      code: "UNAUTHORIZED",
      message: "Token revoked",
      details: "Please sign in again.",
    });
  }

  req.user = { id: payload.id };
  req.token = token;

  next();
};
