import { ApiError } from "../errors/api-error";

export const getBearerToken = (authHeader: string | undefined) => {
  if (!authHeader) {
    throw new ApiError({
      code: "UNAUTHORIZED",
      message: "Token missing",
      details: "Please provide a valid token in the Authorization header.",
    });
  }

  const parts = authHeader.trim().split(/\s+/);

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new ApiError({
      code: "UNAUTHORIZED",
      message: "Invalid Authorization format",
      details: "Expected format: Bearer <token>",
    });
  }

  return parts[1] || "";
};

export const requireToken = (token: string | undefined) => {
  if (!token) {
    throw new ApiError({
      code: "UNAUTHORIZED",
      message: "Token missing",
      details: "Please sign in.",
    });
  }
  return token;
};
