import { validateObject } from "../../errors/validate-object";
import type { Conversation } from "../../modules/conversation/conversation.types";
import { ConversationRepo } from "./repo";
import {
  ConversationDTOSchema,
  MessageDTOSchema,
} from "../../modules/conversation/conversation.schema";
// import { ApiError } from "../../errors/api-error";
import {
  buildPaginationMeta,
  type PaginationQuery,
} from "../../modules/shared/pagination.schema";
import { generateResponse } from "../../services/gemini";
export const ConversationService = {
  create: async (data: Conversation.Create, userId: string) => {
    const conversation = await ConversationRepo.create(data, userId);
    return validateObject<Conversation.DTO>(
      ConversationDTOSchema,
      conversation,
    );
  },
  getAll: async (userId: string, pagination: PaginationQuery) => {
    const data = await ConversationRepo.getAll(userId, pagination);
    return {
      data: data.conversations.map((conversation) =>
        validateObject<Conversation.DTO>(ConversationDTOSchema, conversation),
      ),
      meta: buildPaginationMeta(data.total, pagination),
    };
  },
  update: async (id: string, data: Conversation.Update, userId: string) => {
    const update = await ConversationRepo.update(id, data, userId);
    return validateObject<Conversation.DTO>(ConversationDTOSchema, update);
  },

  delete: async (id: string, userId: string) => {
    await ConversationRepo.remove(id, userId);

    return { success: true };
  },
  getById: async (id: string, userId: string) => {
    const data = await ConversationRepo.getById(id, userId);
    return validateObject<Conversation.DTO>(ConversationDTOSchema, data);
  },

  createmessage: async (
    id: string,
    data: Conversation.CreateMessage,
    userId: string,
  ) => {
    const message = await ConversationRepo.createmessage(id, data, userId);
    const aiContent = await generateResponse(data.content);

    const assistantMessage = await ConversationRepo.createAssistantMessage(
      id,
      aiContent,
    );
    // return validateObject<Conversation.DTOMessage>(MessageDTOSchema, message);
    return {
      userMessage: validateObject<Conversation.DTOMessage>(
        MessageDTOSchema,
        message,
      ),
      assistantMessage: validateObject<Conversation.DTOMessage>(
        MessageDTOSchema,
        assistantMessage,
      ),
    };
  },
  getmessages: async (
    Id: string,
    pagination: PaginationQuery,
    userId: string,
  ) => {
    const data = await ConversationRepo.getmessages(Id, pagination, userId);
    return {
      data: data.messages.map((message) =>
        validateObject<Conversation.DTOMessage>(MessageDTOSchema, message),
      ),
      meta: buildPaginationMeta(data.total, pagination),
    };
  },
};
