import { Router } from "express";
import { validateRequestInput } from "../../errors/validate-request-input";
import {
  CreateConversationSchema,
  IdParamSchema,
} from "../../modules/conversation/conversation.schema";
import { ConversationController } from "../../core/conversation/controller";
import { authMiddleware } from "../../middleware/auth";
// import { PaginationQuerySchema } from "../../modules/shared/pagination.schema";

const conversation = Router();

conversation.post(
  "/",
  authMiddleware,
  validateRequestInput({ body: CreateConversationSchema }),
  ConversationController.create,
);

// conversation.get(
//   "/",
//   authMiddleware,
//   validateRequestInput({ query: PaginationQuerySchema }),
//   DocumentController.getAll,
// );

// conversation.get(
//   "/:id/download",
//   authMiddleware,
//   validateRequestInput({ params: IdParamSchema }),
//   DocumentController.download,
// );

// conversation.get(
//   "/:id",
//   authMiddleware,
//   validateRequestInput({ params: IdParamSchema }),
//   DocumentController.getById,
// );

// conversation.put(
//   "/:id",
//   authMiddleware,
//   validateRequestInput({ params: IdParamSchema, body: UpdateDocumentSchema }),
//   DocumentController.update,
// );

// conversation.delete(
//   "/:id",
//   authMiddleware,
//   validateRequestInput({ params: IdParamSchema }),
//   DocumentController.delete,
// );

export default conversation;
