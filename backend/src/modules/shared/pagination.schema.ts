import Joi from "joi";

export const PaginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).options({ stripUnknown: true });

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function toSkipTake(query: PaginationQuery): {
  skip: number;
  take: number;
} {
  return { skip: (query.page - 1) * query.limit, take: query.limit };
}

export function buildPaginationMeta(
  total: number,
  query: PaginationQuery,
): PaginationMeta {
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}
