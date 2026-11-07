import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../../src/middleware/rate-limit", () => {
  const passThrough = (
    _req: unknown,
    _res: unknown,
    next: (error?: unknown) => void,
  ) => next();

  return {
    apiLimiter: passThrough,
    signinLimiter: passThrough,
    signupLimiter: passThrough,
    refreshLimiter: passThrough,
    messageBurstLimiter: passThrough,
    messageDailyLimiter: passThrough,
  };
});

vi.mock("../../src/core/auth/service", () => ({
  AuthService: {
    signup: vi.fn(),
    signin: vi.fn(),
    verifyToken: vi.fn(),
    refreshToken: vi.fn(),
    signOut: vi.fn(),
  },
}));

import app from "../../src/app";
import { AuthService } from "../../src/core/auth/service";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { ApiError } from "../../src/errors/api-error";
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = app.listen(0);

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

describe("Application Integration Tests", () => {
  it("should return JSON 404 for unknown routes", async () => {
    const response = await fetch(`${baseUrl}/api/unknown-route`);

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should include no-store cache header", async () => {
    const response = await fetch(`${baseUrl}/api/unknown-route`);

    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("should signup and set HTTP-only authentication cookies", async () => {
    vi.mocked(AuthService.signup).mockResolvedValue({
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
    });

    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "StrongPassword123",
      }),
    });

    expect(response.status).toBe(201);

    const body = await response.json();

    expect(body).toEqual({
      message: "Sign Up successfully",
    });

    expect(body).not.toHaveProperty("accessToken");
    expect(body).not.toHaveProperty("refreshToken");

    const setCookie = response.headers.get("set-cookie") ?? "";
    const cookies = setCookie.split(/, (?=[^;,]+=)/);

    const accessCookie = cookies.find((cookie) =>
      cookie.startsWith("accessToken="),
    );

    const refreshCookie = cookies.find((cookie) =>
      cookie.startsWith("refreshToken=test-refresh-token"),
    );

    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();

    expect(accessCookie).toContain("HttpOnly");
    expect(refreshCookie).toContain("HttpOnly");

    expect(accessCookie).toContain("Path=/");
    expect(refreshCookie).toContain("Path=/api/auth");

    expect(AuthService.signup).toHaveBeenCalledWith({
      name: "Test User",
      email: "test@example.com",
      password: "StrongPassword123",
    });
  });

  it("should signin and set HTTP-only authentication cookies", async () => {
    vi.mocked(AuthService.signin).mockResolvedValue({
      accessToken: "signin-access-token",
      refreshToken: "signin-refresh-token",
    });

    const response = await fetch(`${baseUrl}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "StrongPassword123",
      }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toEqual({
      message: "Sign In successfully",
    });

    expect(body).not.toHaveProperty("accessToken");
    expect(body).not.toHaveProperty("refreshToken");

    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(setCookie).toContain("accessToken=signin-access-token");
    expect(setCookie).toContain("refreshToken=signin-refresh-token");
    expect(setCookie).toContain("HttpOnly");

    expect(AuthService.signin).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "StrongPassword123",
    });
  });

  it("should verify access token from HTTP-only cookie", async () => {
    vi.mocked(AuthService.verifyToken).mockResolvedValue({
      user: { id: "user-123" },
    });

    const response = await fetch(`${baseUrl}/api/auth/verify`, {
      headers: {
        Cookie: "accessToken=test-access-token",
      },
    });

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      data: { user: { id: "user-123" } },
      message: "Token is valid",
    });

    expect(AuthService.verifyToken).toHaveBeenCalledWith("test-access-token");
  });

  it("should refresh tokens using HTTP-only refresh cookie", async () => {
    vi.mocked(AuthService.refreshToken).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });

    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: "refreshToken=old-refresh-token",
      },
    });

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      message: "Token refreshed successfully",
    });

    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(setCookie).toContain("accessToken=new-access-token");
    expect(setCookie).toContain("refreshToken=new-refresh-token");
    expect(setCookie).toContain("HttpOnly");

    expect(AuthService.refreshToken).toHaveBeenCalledWith("old-refresh-token");
  });

  it("should signout and clear authentication cookies", async () => {
    vi.mocked(AuthService.signOut).mockResolvedValue(undefined);

    const response = await fetch(`${baseUrl}/api/auth/signout`, {
      method: "POST",
      headers: {
        Cookie:
          "accessToken=test-access-token; refreshToken=test-refresh-token",
      },
    });

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      message: "Sign Out successfully",
    });

    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(setCookie).toContain("accessToken=");
    expect(setCookie).toContain("refreshToken=");
    expect(setCookie).toContain("Expires=");
    expect(setCookie).toContain("HttpOnly");

    expect(AuthService.signOut).toHaveBeenCalledWith(
      "test-access-token",
      "test-refresh-token",
    );
  });

  it("should return 400 for malformed JSON", async () => {
    const response = await fetch(`${baseUrl}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: '{"email": "test@example.com", "password":',
    });

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should return 400 for empty signin body", async () => {
    const response = await fetch(`${baseUrl}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);

    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should return 413 when request body exceeds 32 KB", async () => {
    const largeBody = JSON.stringify({
      email: "test@example.com",
      password: "A".repeat(33 * 1024),
    });

    const response = await fetch(`${baseUrl}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: largeBody,
    });

    expect(response.status).toBe(413);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should return generic 500 for unexpected errors", async () => {
    vi.mocked(AuthService.signup).mockRejectedValueOnce(
      new Error("Sensitive database connection details"),
    );

    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "StrongPassword123",
      }),
    });

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body).toEqual({
      message: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
    });

    expect(JSON.stringify(body)).not.toContain(
      "Sensitive database connection details",
    );

    expect(body).not.toHaveProperty("stack");
  });

  it("should return 400 for invalid signup input", async () => {
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email",
        password: "123",
      }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(AuthService.signup).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid signin input", async () => {
    const response = await fetch(`${baseUrl}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email",
        password: "",
      }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(AuthService.signin).not.toHaveBeenCalled();
  });

  it("should reject verify without access cookie", async () => {
    vi.mocked(AuthService.verifyToken).mockRejectedValueOnce(
      new ApiError({
        code: "UNAUTHORIZED",
        message: "Missing or invalid token",
        details: "Please sign in again.",
      }),
    );

    const response = await fetch(`${baseUrl}/api/auth/verify`);
    expect(response.status).toBe(401);
    expect(AuthService.verifyToken).toHaveBeenCalledWith(undefined);
  });

  it("should reject refresh without refresh cookie", async () => {
    vi.mocked(AuthService.refreshToken).mockRejectedValueOnce(
      new ApiError({
        code: "UNAUTHORIZED",
        message: "Missing or invalid token",
        details: "Please sign in again.",
      }),
    );

    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
    });

    expect(response.status).toBe(401);
    expect(AuthService.refreshToken).toHaveBeenCalledWith(undefined);
  });

  it("should sign out successfully without cookies", async () => {
    const response = await fetch(`${baseUrl}/api/auth/signout`, {
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(AuthService.signOut).toHaveBeenCalledWith(undefined, undefined);

    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("accessToken=");
    expect(setCookie).toContain("refreshToken=");
  });
});
