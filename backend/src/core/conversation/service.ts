import { validateObject } from "../../errors/validate-object";
import type { Conversation } from "../../modules/conversation/conversation.types";
import { ConversationRepo } from "./repo";
import { ConversationDTOSchema } from "../../modules/conversation/conversation.schema";
// import { ApiError } from "../../errors/api-error";
// import {
//   buildPaginationMeta,
//   type PaginationQuery,
// } from "../../modules/shared/pagination.schema";
export const ConversationService = {
  create: async (data: Conversation.Create, userId: string) => {
    const conversation = await ConversationRepo.create(data, userId);
    return validateObject<Conversation.DTO>(
      ConversationDTOSchema,
      conversation,
    );
  },
  //   getAll: async (userId: string, pagination: PaginationQuery) => {
  //     const data = await DocumentRepo.getAll(userId, pagination);
  //     return {
  //       data: data.documents.map((document) =>
  //         validateObject<Document.DTO>(DocumentDTOSchema, document),
  //       ),
  //       meta: buildPaginationMeta(data.total, pagination),
  //     };
  //   },
  //   update: async (id: string, data: Document.Update, userId: string) => {
  //     const update = await DocumentRepo.update(id, data, userId);
  //     return validateObject<Document.DTO>(DocumentDTOSchema, update);
  //   },

  //   delete: async (id: string, userId: string) => {
  //     const document = await DocumentRepo.markDeleting(id, userId);

  //     try {
  //       await deleteFromMinio(document.storageKey);

  //       await DocumentRepo.remove(id);

  //       return { success: true };
  //     } catch (error) {
  //       // Keep the document DELETING.
  //       // It can be retried/reconciled later.
  //       throw error;
  //     }
  //   },
  //   getById: async (id: string, userId: string) => {
  //     const document = await DocumentRepo.getById(id, userId);
  //     return validateObject<Document.DTO>(DocumentDTOSchema, document);
  //   },
};
