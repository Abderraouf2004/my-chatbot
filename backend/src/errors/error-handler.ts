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

  console.error(
    JSON.stringify({
      type: "application_error",
      // requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: req.statusCode,
      message: error.message,
      timestamp: new Date().toISOString(),
    }),
  );

  return res.status(500).json({
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
};
