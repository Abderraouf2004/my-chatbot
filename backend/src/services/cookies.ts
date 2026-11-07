import type { CookieOptions, Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

const base: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
};

const REFRESH_PATH = "/api/auth";
const LEGACY_REFRESH_PATH = "/api/auth/refresh";

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie("accessToken", accessToken, {
    ...base,
    path: "/",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    ...base,
    path: REFRESH_PATH,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.clearCookie("refreshToken", { ...base, path: LEGACY_REFRESH_PATH });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", { ...base, path: "/" });
  res.clearCookie("refreshToken", { ...base, path: REFRESH_PATH });
  res.clearCookie("refreshToken", { ...base, path: LEGACY_REFRESH_PATH }); // LEGACY
};
