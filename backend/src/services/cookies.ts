import type { CookieOptions, Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

const base: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
};

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
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", { path: "/" });

  res.clearCookie("refreshToken", {
    path: "/api/auth/refresh",
  });
};
