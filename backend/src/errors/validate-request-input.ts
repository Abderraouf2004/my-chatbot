import type { NextFunction, Request, RequestHandler, Response } from "express";
import Joi from "joi";
import { tryCatch } from "./try-catch";
import { validateObject } from "./validate-object";

type RequestSchemas = {
  body?: Joi.ObjectSchema<any>;
  query?: Joi.ObjectSchema<any>;
  params?: Joi.ObjectSchema<any>;
};

export const validateRequestInput = ({
  body: bodySchema,
  params: paramSchema,
  query: querySchema,
}: RequestSchemas): RequestHandler =>
  tryCatch((req: Request, _res: Response, next: NextFunction) => {
    if (bodySchema) {
      req.body = validateObject(bodySchema, req.body);
    }

    if (paramSchema) {
      Object.assign(req.params, validateObject(paramSchema, req.params));
    }

    if (querySchema) {
      const validatedQuery = validateObject(querySchema, req.query);

      Object.defineProperty(req, "query", {
        value: validatedQuery,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    next();
  });
