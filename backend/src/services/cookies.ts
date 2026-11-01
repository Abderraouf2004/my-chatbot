// import type { CookieOptions, Response } from "express";

// const isProduction = process.env.NODE_ENV === "production";

// const base: CookieOptions = {
//   httpOnly: true,
//   secure: isProduction,
//   sameSite: "lax",
// };

// export const setAuthCookies = (
//   res: Response,
//   accessToken: string,
//   refreshToken: string,
// ) => {
//   res.cookie("accessToken", accessToken, {
//     ...base,
//     path: "/",
//     maxAge: 15 * 60 * 1000,
//   });
//   res.cookie("refreshToken", refreshToken, {
//     ...base,
//     path: "/api/auth/refresh",
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//   });
// };

// export const clearAuthCookies = (res: Response) => {
//   res.clearCookie("accessToken", { path: "/" });

//   res.clearCookie("refreshToken", {
//     path: "/api/auth/refresh",
//   });
// };

import type { CookieOptions, Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

const base: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
};

// Must cover BOTH /api/auth/refresh and /api/auth/signout.
const REFRESH_PATH = "/api/auth";
// Old path used before this fix (remove all LEGACY lines after ~7 days).
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
  // LEGACY: drop the old-path cookie so the browser never sends two refreshToken cookies
  res.clearCookie("refreshToken", { ...base, path: LEGACY_REFRESH_PATH });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", { ...base, path: "/" });
  res.clearCookie("refreshToken", { ...base, path: REFRESH_PATH });
  res.clearCookie("refreshToken", { ...base, path: LEGACY_REFRESH_PATH }); // LEGACY
};
