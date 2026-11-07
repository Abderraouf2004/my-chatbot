import { afterEach, describe, expect, it, vi } from "vitest";
import type { Response } from "express";

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }

  vi.resetModules();
  vi.clearAllMocks();
});

describe("Auth Cookies", () => {
  it("should set access cookie with secure attributes", async () => {
    process.env.NODE_ENV = "test";
    vi.resetModules();

    const { setAuthCookies } = await import("../../src/services/cookies");

    const res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as Response;

    setAuthCookies(res, "access-token", "refresh-token");

    expect(res.cookie).toHaveBeenCalledWith("accessToken", "access-token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
  });

  it("should set refresh cookie with restricted path and expiration", async () => {
    process.env.NODE_ENV = "test";
    vi.resetModules();

    const { setAuthCookies } = await import("../../src/services/cookies");

    const res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as Response;

    setAuthCookies(res, "access-token", "refresh-token");

    expect(res.cookie).toHaveBeenCalledWith("refreshToken", "refresh-token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    expect(res.clearCookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.objectContaining({
        path: "/api/auth/refresh",
        httpOnly: true,
        sameSite: "lax",
      }),
    );
  });

  it("should clear all authentication cookies on signout", async () => {
    process.env.NODE_ENV = "test";
    vi.resetModules();

    const { clearAuthCookies } = await import("../../src/services/cookies");

    const res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as Response;

    clearAuthCookies(res);

    expect(res.clearCookie).toHaveBeenCalledTimes(3);

    expect(res.clearCookie).toHaveBeenCalledWith(
      "accessToken",
      expect.objectContaining({ path: "/" }),
    );

    expect(res.clearCookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.objectContaining({ path: "/api/auth" }),
    );

    expect(res.clearCookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.objectContaining({ path: "/api/auth/refresh" }),
    );
  });

  it("should set Secure flag in production", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();

    const { setAuthCookies } = await import("../../src/services/cookies");

    const res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as Response;

    setAuthCookies(res, "access-token", "refresh-token");

    expect(res.cookie).toHaveBeenCalledWith(
      "accessToken",
      "access-token",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      }),
    );

    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "refresh-token",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      }),
    );
  });
});
