import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/core/auth/repo", () => ({
  AuthRepo: {
    readByEmail: vi.fn(),
    readById: vi.fn(),
    signup: vi.fn(),
  },
}));

vi.mock("../../src/services/hash", () => ({
  hash: {
    hashPassword: vi.fn(),
    comparePassword: vi.fn(),
  },
}));

vi.mock("../../src/services/token", () => ({
  tokenService: {
    generateToken: vi.fn(),
    verifyToken: vi.fn(),
  },
}));

vi.mock("../../src/services/redis", () => ({
  redisService: {
    getClient: vi.fn(),
  },
}));

import { AuthService } from "../../src/core/auth/service";
import { AuthRepo } from "../../src/core/auth/repo";
import { hash } from "../../src/services/hash";
import { tokenService } from "../../src/services/token";
import { redisService } from "../../src/services/redis";
import jwt from "jsonwebtoken";
const mockedRepo = vi.mocked(AuthRepo);
const mockedHash = vi.mocked(hash);
const mockedToken = vi.mocked(tokenService);
const mockedRedis = vi.mocked(redisService);
describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signup", () => {
    it("should signup a new user successfully", async () => {
      mockedRepo.readByEmail.mockResolvedValue(null);

      mockedHash.hashPassword.mockResolvedValue("hashed-password");

      mockedRepo.signup.mockResolvedValue({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        password: "hashed-password",
      } as never);

      mockedToken.generateToken
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const result = await AuthService.signup({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      expect(mockedHash.hashPassword).toHaveBeenCalledWith("password123");

      expect(mockedRepo.signup).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "hashed-password",
      });

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });

    it("should reject signup when email already exists", async () => {
      mockedRepo.readByEmail.mockResolvedValue({
        id: "user-1",
      } as never);

      await expect(
        AuthService.signup({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        }),
      ).rejects.toMatchObject({
        message: "Email already in use",
      });

      expect(mockedHash.hashPassword).not.toHaveBeenCalled();
      expect(mockedRepo.signup).not.toHaveBeenCalled();
    });

    it("should reject when password hashing fails", async () => {
      mockedRepo.readByEmail.mockResolvedValue(null as never);

      mockedHash.hashPassword.mockRejectedValue(new Error("Hashing failed"));

      await expect(
        AuthService.signup({
          email: "test@example.com",
          password: "Password123!",
        } as never),
      ).rejects.toThrow("Hashing failed");

      expect(mockedRepo.signup).not.toHaveBeenCalled();
    });

    it("should reject when user creation fails", async () => {
      mockedRepo.readByEmail.mockResolvedValue(null as never);
      mockedHash.hashPassword.mockResolvedValue("hashed-password");
      mockedRepo.signup.mockRejectedValue(new Error("Database error"));

      await expect(
        AuthService.signup({
          email: "test@example.com",
          password: "Password123!",
        } as never),
      ).rejects.toThrow("Database error");

      expect(mockedRepo.signup).toHaveBeenCalled();
      expect(mockedToken.generateToken).not.toHaveBeenCalled();
    });
  });

  describe("signin", () => {
    it("should signin successfully with valid credentials", async () => {
      mockedRepo.readByEmail.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        password: "hashed-password",
      } as never);

      mockedHash.comparePassword.mockResolvedValue(true);

      mockedToken.generateToken
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const result = await AuthService.signin({
        email: "test@example.com",
        password: "password123",
      });

      expect(mockedHash.comparePassword).toHaveBeenCalledWith(
        "password123",
        "hashed-password",
      );

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });

    it("should reject signin when user does not exist", async () => {
      mockedRepo.readByEmail.mockResolvedValue(null);

      await expect(
        AuthService.signin({
          email: "unknown@example.com",
          password: "password123",
        }),
      ).rejects.toMatchObject({
        message: "No user with this email or no password",
      });

      expect(mockedHash.comparePassword).not.toHaveBeenCalled();
    });

    it("should reject signin when password is incorrect", async () => {
      mockedRepo.readByEmail.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        password: "hashed-password",
      } as never);

      mockedHash.comparePassword.mockResolvedValue(false);

      await expect(
        AuthService.signin({
          email: "test@example.com",
          password: "wrong-password",
        }),
      ).rejects.toMatchObject({
        message: "Invalid password",
      });
    });

    it("should reject signin when user has no password", async () => {
      mockedRepo.readByEmail.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        password: null,
      } as never);

      await expect(
        AuthService.signin({
          email: "test@example.com",
          password: "password123",
        }),
      ).rejects.toMatchObject({
        message: "No user with this email or no password",
      });

      expect(mockedHash.comparePassword).not.toHaveBeenCalled();
    });

    it("should reject when password comparison fails", async () => {
      mockedRepo.readByEmail.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        password: "hashed-password",
      } as never);

      mockedHash.comparePassword.mockRejectedValue(
        new Error("Password comparison failed"),
      );

      await expect(
        AuthService.signin({
          email: "test@example.com",
          password: "Password123!",
        }),
      ).rejects.toThrow("Password comparison failed");

      expect(mockedToken.generateToken).not.toHaveBeenCalled();
    });
  });
  describe("verifyToken", () => {
    it("should verify a valid access token", async () => {
      const redis = {
        get: vi.fn().mockResolvedValue(null),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      mockedToken.verifyToken.mockReturnValue({
        id: "user-1",
        type: "access",
      });

      mockedRepo.readById.mockResolvedValue({
        id: "user-1",
      } as never);

      const result = await AuthService.verifyToken("valid-access-token");

      expect(result).toEqual({
        user: {
          id: "user-1",
        },
      });

      expect(redis.get).toHaveBeenCalledWith("blacklist:valid-access-token");
    });

    it("should reject when access token is missing", async () => {
      await expect(AuthService.verifyToken(undefined)).rejects.toBeDefined();

      expect(mockedToken.verifyToken).not.toHaveBeenCalled();
    });

    it("should reject a blacklisted token", async () => {
      const redis = {
        get: vi.fn().mockResolvedValue("blacklisted"),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      await expect(
        AuthService.verifyToken("revoked-token"),
      ).rejects.toMatchObject({
        message: "Token revoked",
      });

      expect(mockedToken.verifyToken).not.toHaveBeenCalled();
    });

    it("should reject when user does not exist", async () => {
      const redis = {
        get: vi.fn().mockResolvedValue(null),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      mockedToken.verifyToken.mockReturnValue({
        id: "missing-user",
        type: "access",
      });

      mockedRepo.readById.mockResolvedValue(null);

      await expect(
        AuthService.verifyToken("valid-access-token"),
      ).rejects.toMatchObject({
        message: "User not found",
      });
    });

    it("should reject an invalid access token", async () => {
      const redis = {
        get: vi.fn().mockResolvedValue(null),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      mockedToken.verifyToken.mockImplementation(() => {
        throw new Error("Invalid or expired token");
      });

      await expect(
        AuthService.verifyToken("invalid-access-token"),
      ).rejects.toBeDefined();

      expect(mockedRepo.readById).not.toHaveBeenCalled();
    });

    it("should reject a refresh token used as access token", async () => {
      const redis = {
        get: vi.fn().mockResolvedValue(null),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      mockedToken.verifyToken.mockImplementation(() => {
        throw new Error("Invalid token type");
      });

      await expect(
        AuthService.verifyToken("refresh-token"),
      ).rejects.toBeDefined();

      expect(mockedToken.verifyToken).toHaveBeenCalledWith(
        "refresh-token",
        "access",
      );

      expect(mockedRepo.readById).not.toHaveBeenCalled();
    });

    it("should reject when Redis is unavailable", async () => {
      const redis = {
        get: vi.fn().mockRejectedValue(new Error("Redis connection failed")),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      await expect(
        AuthService.verifyToken("valid-access-token"),
      ).rejects.toThrow("Redis connection failed");

      expect(mockedToken.verifyToken).not.toHaveBeenCalled();
      expect(mockedRepo.readById).not.toHaveBeenCalled();
    });
  });

  describe("refreshToken", () => {
    it("should refresh tokens successfully", async () => {
      const redis = {
        get: vi.fn().mockResolvedValue(null),
        setEx: vi.fn().mockResolvedValue("OK"),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      mockedToken.verifyToken.mockReturnValue({
        id: "user-1",
        type: "refresh",
      });

      vi.spyOn(jwt, "decode").mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as never);

      mockedToken.generateToken
        .mockReturnValueOnce("new-access-token")
        .mockReturnValueOnce("new-refresh-token");

      const result = await AuthService.refreshToken("old-refresh-token");

      expect(redis.setEx).toHaveBeenCalledWith(
        "blacklist:old-refresh-token",
        expect.any(Number),
        "blacklisted",
      );

      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    });

    it("should reject a blacklisted refresh token", async () => {
      const redis = {
        get: vi.fn().mockResolvedValue("blacklisted"),
        setEx: vi.fn(),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      await expect(
        AuthService.refreshToken("revoked-token"),
      ).rejects.toMatchObject({
        message: "Token revoked",
      });
    });

    it("should reject when refresh token is missing", async () => {
      await expect(AuthService.refreshToken(undefined)).rejects.toBeDefined();
    });

    it("should reject an expired refresh token", async () => {
      const redis = {
        get: vi.fn().mockResolvedValue(null),
        setEx: vi.fn(),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      mockedToken.verifyToken.mockReturnValue({
        id: "user-1",
        type: "refresh",
      });

      vi.spyOn(jwt, "decode").mockReturnValue({
        exp: Math.floor(Date.now() / 1000) - 3600,
      } as never);

      await expect(
        AuthService.refreshToken("expired-token"),
      ).rejects.toMatchObject({
        message: "Refresh token expired",
      });

      expect(redis.setEx).not.toHaveBeenCalled();
    });

    it("should reject an access token used as refresh token", async () => {
      const redis = {
        get: vi.fn().mockResolvedValue(null),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      mockedToken.verifyToken.mockImplementation(() => {
        throw new Error("Invalid token type");
      });

      await expect(
        AuthService.refreshToken("access-token"),
      ).rejects.toBeDefined();

      expect(mockedToken.verifyToken).toHaveBeenCalledWith(
        "access-token",
        "refresh",
      );

      expect(mockedToken.generateToken).not.toHaveBeenCalled();
    });

    it("should reject when Redis is unavailable", async () => {
      const redis = {
        get: vi.fn().mockRejectedValue(new Error("Redis connection failed")),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      await expect(
        AuthService.refreshToken("valid-refresh-token"),
      ).rejects.toThrow("Redis connection failed");

      expect(mockedToken.verifyToken).not.toHaveBeenCalled();
      expect(mockedToken.generateToken).not.toHaveBeenCalled();
    });

    it("should reject when generating new tokens fails", async () => {
      const redis = {
        get: vi.fn().mockResolvedValue(null),
        setEx: vi.fn().mockResolvedValue("OK"),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      mockedToken.verifyToken.mockReturnValue({
        id: "user-1",
        type: "refresh",
      } as never);

      vi.spyOn(jwt, "decode").mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as never);

      mockedToken.generateToken.mockImplementation(() => {
        throw new Error("Token generation failed");
      });

      await expect(
        AuthService.refreshToken("valid-refresh-token"),
      ).rejects.toThrow("Token generation failed");

      expect(redis.setEx).toHaveBeenCalled();
    });
  });

  describe("signOut", () => {
    it("should blacklist valid access and refresh tokens", async () => {
      const redis = {
        setEx: vi.fn().mockResolvedValue("OK"),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      mockedToken.verifyToken.mockReturnValue({
        id: "user-1",
        type: "access",
      });

      vi.spyOn(jwt, "decode")
        .mockReturnValueOnce({
          exp: Math.floor(Date.now() / 1000) + 3600,
        } as never)
        .mockReturnValueOnce({
          exp: Math.floor(Date.now() / 1000) + 3600,
        } as never);

      await AuthService.signOut("valid-access-token", "valid-refresh-token");

      expect(redis.setEx).toHaveBeenCalledTimes(2);
    });

    it("should ignore invalid tokens", async () => {
      const redis = {
        setEx: vi.fn(),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      mockedToken.verifyToken.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await AuthService.signOut(
        "invalid-access-token",
        "invalid-refresh-token",
      );

      expect(redis.setEx).not.toHaveBeenCalled();
    });

    it("should ignore missing tokens", async () => {
      const redis = {
        setEx: vi.fn(),
      };

      mockedRedis.getClient.mockReturnValue(redis as never);

      await AuthService.signOut(undefined, undefined);

      expect(redis.setEx).not.toHaveBeenCalled();
    });
  });

  it("should blacklist access token when refresh token is invalid", async () => {
    const redis = {
      setEx: vi.fn().mockResolvedValue("OK"),
    };

    mockedRedis.getClient.mockReturnValue(redis as never);

    mockedToken.verifyToken
      .mockReturnValueOnce({
        id: "user-1",
        type: "access",
      } as never)
      .mockImplementationOnce(() => {
        throw new Error("Invalid refresh token");
      });

    vi.spyOn(jwt, "decode").mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as never);

    await AuthService.signOut("valid-access-token", "invalid-refresh-token");

    expect(redis.setEx).toHaveBeenCalledTimes(1);
    expect(redis.setEx).toHaveBeenCalledWith(
      "blacklist:valid-access-token",
      expect.any(Number),
      "blacklisted",
    );
  });

  it("should blacklist refresh token when access token is invalid", async () => {
    const redis = {
      setEx: vi.fn().mockResolvedValue("OK"),
    };

    mockedRedis.getClient.mockReturnValue(redis as never);

    mockedToken.verifyToken
      .mockImplementationOnce(() => {
        throw new Error("Invalid access token");
      })
      .mockReturnValueOnce({
        id: "user-1",
        type: "refresh",
      } as never);

    vi.spyOn(jwt, "decode").mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 3600,
    } as never);

    await AuthService.signOut("invalid-access-token", "valid-refresh-token");

    expect(redis.setEx).toHaveBeenCalledTimes(1);
    expect(redis.setEx).toHaveBeenCalledWith(
      "blacklist:valid-refresh-token",
      expect.any(Number),
      "blacklisted",
    );
  });

  it("should not blacklist expired tokens", async () => {
    const redis = {
      setEx: vi.fn().mockResolvedValue("OK"),
    };

    mockedRedis.getClient.mockReturnValue(redis as never);

    mockedToken.verifyToken.mockReturnValue({
      id: "user-1",
      type: "access",
    } as never);

    vi.spyOn(jwt, "decode").mockReturnValue({
      exp: Math.floor(Date.now() / 1000) - 3600,
    } as never);

    await AuthService.signOut("expired-access-token", "expired-refresh-token");

    expect(redis.setEx).not.toHaveBeenCalled();
  });
});
