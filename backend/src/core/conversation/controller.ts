import type { Request, Response } from "express";
import { tryCatch } from "../../errors/try-catch";
import { ConversationService } from "./service";
import type { PaginationQuery } from "../../modules/shared/pagination.schema";

export const ConversationController = {
  create: tryCatch(async (req: Request, res: Response) => {
    const data = await ConversationService.create(
      req.body,
      req.user?.id as string,
    );
    res
      .status(201)
      .json({ data, message: "Conversation created successfully" });
  }),
  getAll: tryCatch(async (req: Request, res: Response) => {
    const pagination = req.query as unknown as PaginationQuery;
    const { data, meta } = await ConversationService.getAll(
      req.user?.id as string,
      pagination,
    );
    res
      .status(200)
      .json({ data, meta, message: "Conversations retrieved successfully" });
  }),
  update: tryCatch(async (req: Request, res: Response) => {
    const data = await ConversationService.update(
      req.params.id as string,
      req.body,
      req.user?.id as string,
    );
    res
      .status(200)
      .json({ data, message: "Conversation updated successfully" });
  }),
  delete: tryCatch(async (req: Request, res: Response) => {
    const data = await ConversationService.delete(
      req.params.id as string,
      req.user?.id as string,
    );
    res
      .status(200)
      .json({ data, message: "Conversation deleted successfully" });
  }),
  getById: tryCatch(async (req: Request, res: Response) => {
    const data = await ConversationService.getById(
      req.params.id as string,
      req.user?.id as string,
    );
    res
      .status(200)
      .json({ data, message: "Conversation retrieved successfully" });
  }),
  createmessage: tryCatch(async (req: Request, res: Response) => {
    const data = await ConversationService.createmessage(
      req.params.id as string,
      req.body,
      req.user?.id as string,
    );
    res.status(201).json({ data, message: "Message created successfully" });
  }),
};
