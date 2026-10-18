import type { Request, Response } from "express";
import { tryCatch } from "../../errors/try-catch";
import { ConversationService } from "./service";
// import type { PaginationQuery } from "../../modules/shared/pagination.schema";

export const ConversationController = {
  create: tryCatch(async (req: Request, res: Response) => {
    const data = await ConversationService.create(
      req.body,
      req.user?.id as string,
    );
    res.status(201).json({ data, message: "Conversation created successfully" });
  }),
//   getAll: tryCatch(async (req: Request, res: Response) => {
//     //     const data = await DocumentService.getAll(req.user?.id as string);
//     //     res.status(200).json({ data, message: "Documents retrieved successfully" });
//     const pagination = req.query as unknown as PaginationQuery;
//     const { data, meta } = await DocumentService.getAll(
//       req.user?.id as string,
//       pagination,
//     );
//     res
//       .status(200)
//       .json({ data, meta, message: "Documents retrieved successfully" });
//   }),
//   update: tryCatch(async (req: Request, res: Response) => {
//     const data = await DocumentService.update(
//       req.params.id as string,
//       req.body,
//       req.user?.id as string,
//     );
//     res.status(200).json({ data, message: "Document updated successfully" });
//   }),
//   delete: tryCatch(async (req: Request, res: Response) => {
//     const data = await DocumentService.delete(
//       req.params.id as string,
//       req.user?.id as string,
//     );
//     res.status(200).json({ data, message: "Document deleted successfully" });
//   }),
//   getById: tryCatch(async (req: Request, res: Response) => {
//     const data = await DocumentService.getById(
//       req.params.id as string,
//       req.user?.id as string,
//     );
//     res.status(200).json({ data, message: "Document retrieved successfully" });
//   }),

};