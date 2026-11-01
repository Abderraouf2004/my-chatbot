import { ApiError } from "../errors/api-error";

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
