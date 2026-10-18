import type Joi from "joi";
import { ApiError } from "./api-error";

const formatLabel = (label: string): string =>
  label.charAt(0).toUpperCase() + label.slice(1).replace(/_/g, " ");

export const validateObject = <T>(
  schema: Joi.ObjectSchema<T>,
  data: unknown,
): T => {
  const { value, error } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map((detail) => {
      const label = formatLabel(detail.context?.label || detail.path.join("."));

      switch (detail.type) {
        case "any.required":
          return `${label} is required`;
        case "string.email":
          return `${label} must be a valid email`;
        case "string.min":
          return `${label} must be at least ${detail.context?.limit} characters`;
        case "string.max":
          return `${label} must be at most ${detail.context?.limit} characters`;
        case "string.base":
          return `${label} must be a string`;
        case "number.base":
          return `${label} must be a number`;
        case "array.base":
          return `${label} must be an array`;
        case "object.base":
          return `${label} must be an object`;
        default:
          return `${detail.message.replace(/["]/g, "")}`;
      }
    });

    throw new ApiError({
      message: "Missing or invalid field(s)",
      details: messages.join("; "),
      code: "BAD_REQUEST",
    });
  }

  return value;
};
