import type { NextFunction, Request, RequestHandler, Response } from "express";

export const tryCatch = (fn: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error in TryCatchBlock: ${message}`);
      console.error(`Error in TryCatchBlock  ${JSON.stringify(error)}`);

      next(error);
    }
  };
};
