import type { Request, Response } from "express";
import { tryCatch } from "../../errors/try-catch";
import { AuthService } from "./service";
import { setAuthCookies, clearAuthCookies } from "../../services/cookies";

export const AuthController = {
  verifyToken: tryCatch(async (req: Request, res: Response) => {
    const data = await AuthService.verifyToken(req.cookies?.accessToken);

    res.status(200).json({
      data,
      message: "Token is valid",
    });
  }),

  signup: tryCatch(async (req: Request, res: Response) => {
    const { accessToken, refreshToken } = await AuthService.signup(req.body);

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: "Sign Up successfully",
    });
  }),

  signin: tryCatch(async (req: Request, res: Response) => {
    const { accessToken, refreshToken } = await AuthService.signin(req.body);

    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      message: "Sign In successfully",
    });
  }),

  refresh: tryCatch(async (req: Request, res: Response) => {
    const { accessToken, refreshToken } = await AuthService.refreshToken(
      req.cookies?.refreshToken,
    );

    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      message: "Token refreshed successfully",
    });
  }),

  signOut: tryCatch(async (req: Request, res: Response) => {
    await AuthService.signOut(
      req.cookies?.accessToken,
      req.cookies?.refreshToken,
    );

    clearAuthCookies(res);

    res.status(200).json({
      message: "Sign Out successfully",
    });
  }),
};
