import type { User } from "../../modules/auth/auth.types";
import { AuthRepo } from "./repo";
import { ApiError } from "../../errors/api-error";
import { hash } from "../../services/hash";
import { tokenService } from "../../services/token";
import { redisService } from "../../services/redis";
import jwt from "jsonwebtoken";
import { requireToken } from "../../services/auth-header";

export const AuthService = {
  verifyToken: async (accessToken: string | undefined) => {
    const token = requireToken(accessToken);

    const redis = redisService.getClient();
    const isBlacklisted = await redis.get(`blacklist:${token}`);

    if (isBlacklisted) {
      throw new ApiError({
        code: "UNAUTHORIZED",
        message: "Token revoked",
        details: "Please sign in again.",
      });
    }

    const payload = tokenService.verifyToken(token, "access");

    if (!payload) {
      throw new ApiError({
        code: "UNAUTHORIZED",
        message: "Invalid token",
        details: "The token is invalid or expired.",
      });
    }

    const user = await AuthRepo.readById(payload.id);

    if (!user) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "User not found",
        details: "The user associated with this token does not exist.",
      });
    }

    return {
      user: {
        id: user.id,
      },
    };
  },

  signup: async (data: User.signup) => {
    const existingUser = await AuthRepo.readByEmail(data.email);

    if (existingUser) {
      throw new ApiError({
        code: "CONFLICT",
        message: "Email already in use",
        details: "The email provided is already associated with an account.",
      });
    }

    const hashedPassword = await hash.hashPassword(data.password);

    const user = await AuthRepo.signup({
      ...data,
      password: hashedPassword,
    });

    return {
      accessToken: tokenService.generateToken(user.id, "access", "15m"),
      refreshToken: tokenService.generateToken(user.id, "refresh", "7d"),
    };
  },

  signin: async (data: User.signin) => {
    const user = await AuthRepo.readByEmail(data.email);

    if (!user || user.password == null) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "No user with this email or no password",
        details: "The email provided does not match any user in our records.",
      });
    }

    const isPasswordValid = await hash.comparePassword(
      data.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message: "Invalid password",
        details: "The password provided is incorrect.",
      });
    }

    return {
      accessToken: tokenService.generateToken(user.id, "access", "15m"),
      refreshToken: tokenService.generateToken(user.id, "refresh", "7d"),
    };
  },

  refreshToken: async (refreshToken: string | undefined) => {
    const token = requireToken(refreshToken);

    const redis = redisService.getClient();
    const isBlacklisted = await redis.get(`blacklist:${token}`);

    if (isBlacklisted) {
      throw new ApiError({
        code: "UNAUTHORIZED",
        message: "Token revoked",
        details: "Please sign in again.",
      });
    }

    const payload = tokenService.verifyToken(token, "refresh");

    if (!payload) {
      throw new ApiError({
        code: "UNAUTHORIZED",
        message: "Invalid refresh token",
        details: "Please sign in again.",
      });
    }

    const decoded = jwt.decode(token) as { exp?: number } | null;
    const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0;

    if (ttl <= 0) {
      throw new ApiError({
        code: "UNAUTHORIZED",
        message: "Refresh token expired",
        details: "Please sign in again.",
      });
    }

    await redis.setEx(`blacklist:${token}`, ttl, "blacklisted");

    return {
      accessToken: tokenService.generateToken(payload.id, "access", "15m"),
      refreshToken: tokenService.generateToken(payload.id, "refresh", "7d"),
    };
  },

  signOut: async (
    accessToken: string | undefined,
    refreshToken: string | undefined,
  ) => {
    const redis = redisService.getClient();

    for (const [token, type] of [
      [accessToken, "access"],
      [refreshToken, "refresh"],
    ] as const) {
      if (!token) continue;

      try {
        tokenService.verifyToken(token, type);
      } catch {
        continue;
      }

      const decoded = jwt.decode(token) as { exp?: number } | null;
      const ttl = decoded?.exp
        ? decoded.exp - Math.floor(Date.now() / 1000)
        : 0;

      if (ttl > 0) {
        await redis.setEx(`blacklist:${token}`, ttl, "blacklisted");
      }
    }
  },
};
