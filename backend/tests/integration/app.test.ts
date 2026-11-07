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
});
