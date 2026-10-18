import { ApiError } from "../errors/api-error";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "";

export type TokenEncryptionPayload = {
  id: string;
};

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

class TokenService {
  private static instance: TokenService;

  private constructor(private readonly jwtSecret: string) {}

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService(JWT_SECRET);
    }

    return TokenService.instance;
  }

  generateToken(
    payload: TokenEncryptionPayload,
    expiresIn: string = "1d",
  ): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn,
    } as SignOptions);
  }

  verifyToken(token: string, isRefresh: boolean): TokenEncryptionPayload {
    try {
      const data = jwt.verify(token, this.jwtSecret) as JwtPayload;

      if (typeof data.id !== "string") {
        throw new Error("Invalid token payload");
      }

      return {
        id: data.id,
      };
    } catch {
      throw new ApiError({
        code: isRefresh ? "FORBIDDEN" : "UNAUTHORIZED",
        message: "Invalid or expired access token. Please sign in again.",
        details: isRefresh
          ? "Refresh token verification failed."
          : "Access token verification failed.",
      });
    }
  }
}

export const tokenService = TokenService.getInstance();
