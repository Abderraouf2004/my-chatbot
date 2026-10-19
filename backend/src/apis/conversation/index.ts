import { Router } from "express";
import { validateRequestInput } from "../../errors/validate-request-input";
import {
  CreateConversationSchema,
  CreateMessageSchema,
  IdParamSchema,
  UpdateConversationSchema,
} from "../../modules/conversation/conversation.schema";
import { ConversationController } from "../../core/conversation/controller";
import { authMiddleware } from "../../middleware/auth";
import { PaginationQuerySchema } from "../../modules/shared/pagination.schema";

const conversation = Router();

conversation.post(
  "/",
  authMiddleware,
  validateRequestInput({ body: CreateConversationSchema }),
  ConversationController.create,
);

conversation.get(
  "/",
  authMiddleware,
  validateRequestInput({ query: PaginationQuerySchema }),
  ConversationController.getAll,
);

conversation.post(
  "/:id/messages",
  authMiddleware,
  validateRequestInput({ params: IdParamSchema, body: CreateMessageSchema }),
  ConversationController.createmessage,
);

conversation.get(
  "/:id/messages",
  authMiddleware,
  validateRequestInput({ params: IdParamSchema, query: PaginationQuerySchema }),
  ConversationController.getmessages,
);
conversation.get(
  "/:id",
  authMiddleware,
  validateRequestInput({ params: IdParamSchema }),
  ConversationController.getById,
);

conversation.put(
  "/:id",
  authMiddleware,
  validateRequestInput({
    params: IdParamSchema,
    body: UpdateConversationSchema,
  }),
  ConversationController.update,
);

conversation.delete(
  "/:id",
  authMiddleware,
  validateRequestInput({ params: IdParamSchema }),
  ConversationController.delete,
);

export default conversation;
