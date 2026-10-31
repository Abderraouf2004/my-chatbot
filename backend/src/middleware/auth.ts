// import type { NextFunction, Request, Response } from "express";
// import { ApiError } from "../errors/api-error";
// import { tokenService } from "../services/token";
// import { redisService } from "../services/redis";
// import { getBearerToken } from "../services/auth-header";
// import { requireToken } from "../services/auth-header";

// export const authMiddleware = async (
//   req: Request,
//   _res: Response,
//   next: NextFunction,
// ) => {
//   // const authHeader = req.headers["authorization"] as string;
//   // const token = getBearerToken(authHeader);
//   const token = requireToken(req.cookies["access_token"]);
//   const payload = tokenService.verifyToken(token, "access");
//   const redis = redisService.getClient();

//   const key = `blacklist:${token}`;
//   const isBlacklisted = await redis.get(key);

//   if (isBlacklisted) {
//     throw new ApiError({
//       code: "UNAUTHORIZED",
//       message: "Token revoked",
//       details: "This token has been revoked. Please sign in again.",
//     });
//   }

//   req.user = {
//     id: payload.id,
//   };

//   req.token = token;

//   next();
// };

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
