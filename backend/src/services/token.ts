import { ApiError } from "../errors/api-error";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "";
export type TokenType = "access" | "refresh";

export type TokenEncryptionPayload = {
  id: string;
  type: TokenType;
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

  generateToken(id: string, type: TokenType, expiresIn: string = "1d"): string {
    return jwt.sign({ id, type }, this.jwtSecret, {
      expiresIn,
    } as SignOptions);
  }

  verifyToken(token: string, expectedType: TokenType): TokenEncryptionPayload {
    try {
      const data = jwt.verify(token, this.jwtSecret) as JwtPayload;

      if (typeof data.id !== "string" || data.type !== expectedType) {
        throw new Error("Invalid token payload or type");
      }
      return {
        id: data.id,
        type: expectedType,
      };
    } catch {
      throw new ApiError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token. Please sign in again.",
        details: `${expectedType} token verification failed.`,
      });
    }
  }
}

export const tokenService = TokenService.getInstance();
