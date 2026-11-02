import type { ErrorRequestHandler } from "express";
import { ApiError } from "./api-error";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      message: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
    });
  }

  // Invalid or empty JSON body
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      message: "Invalid or empty JSON body",
      code: "INVALID_JSON",
    });
  }

  // Request body exceeds the configured limit
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      message: "Request body too large",
      code: "PAYLOAD_TOO_LARGE",
    });
  }

  console.error(
    JSON.stringify({
      type: "application_error",
      method: req.method,
      path: req.originalUrl,
      statusCode: 500,
      message: error?.message,
      timestamp: new Date().toISOString(),
    }),
  );

  return res.status(500).json({
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
};
