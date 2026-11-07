import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("../../src/services/token", () => ({
  tokenService: {
    verifyToken: vi.fn(),
  },
}));

vi.mock("../../src/services/redis", () => ({
  redisService: {
    getClient: vi.fn(),
  },
}));

import { authMiddleware } from "../../src/middleware/auth";
import { tokenService } from "../../src/services/token";
import { redisService } from "../../src/services/redis";

const mockedToken = vi.mocked(tokenService);
const mockedRedis = vi.mocked(redisService);

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (accessToken?: string) =>
    ({
      cookies: accessToken ? { accessToken } : {},
    }) as Request;

  const response = {} as Response;

  it("should reject requests without access token", async () => {
    const req = createRequest();
    const next = vi.fn() as NextFunction;

    await expect(authMiddleware(req, response, next)).rejects.toBeDefined();

    expect(mockedToken.verifyToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject invalid access tokens", async () => {
    const req = createRequest("invalid-token");
    const next = vi.fn() as NextFunction;

    mockedToken.verifyToken.mockImplementation(() => {
      throw new Error("Invalid or expired token");
    });

    await expect(authMiddleware(req, response, next)).rejects.toThrow(
      "Invalid or expired token",
    );

    expect(mockedToken.verifyToken).toHaveBeenCalledWith(
      "invalid-token",
      "access",
    );

    expect(mockedRedis.getClient).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject blacklisted access tokens", async () => {
    const req = createRequest("revoked-token");
    const next = vi.fn() as NextFunction;

    mockedToken.verifyToken.mockReturnValue({
      id: "user-1",
      type: "access",
    } as never);

    const redis = {
      get: vi.fn().mockResolvedValue("blacklisted"),
    };

    mockedRedis.getClient.mockReturnValue(redis as never);

    await expect(authMiddleware(req, response, next)).rejects.toThrow(
      "Token revoked",
    );

    expect(redis.get).toHaveBeenCalledWith("blacklist:revoked-token");

    expect(next).not.toHaveBeenCalled();
  });

  it("should authenticate requests with valid access tokens", async () => {
    const req = createRequest("valid-token");
    const next = vi.fn() as NextFunction;

    mockedToken.verifyToken.mockReturnValue({
      id: "user-1",
      type: "access",
    } as never);

    const redis = {
      get: vi.fn().mockResolvedValue(null),
    };

    mockedRedis.getClient.mockReturnValue(redis as never);

    await authMiddleware(req, response, next);

    expect(req.user).toEqual({ id: "user-1" });
    expect(req.token).toBe("valid-token");

    expect(redis.get).toHaveBeenCalledWith("blacklist:valid-token");

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject when Redis is unavailable", async () => {
    const req = createRequest("valid-token");
    const next = vi.fn() as NextFunction;

    mockedToken.verifyToken.mockReturnValue({
      id: "user-1",
      type: "access",
    } as never);

    const redis = {
      get: vi.fn().mockRejectedValue(new Error("Redis connection failed")),
    };

    mockedRedis.getClient.mockReturnValue(redis as never);

    await expect(authMiddleware(req, response, next)).rejects.toThrow(
      "Redis connection failed",
    );

    expect(next).not.toHaveBeenCalled();
  });
});
