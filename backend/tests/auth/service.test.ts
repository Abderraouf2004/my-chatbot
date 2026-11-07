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
  });
});
