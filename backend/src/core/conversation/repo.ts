import { prisma } from "../../services/prisma";
import { ApiError } from "../../errors/api-error";
// import type { PaginationQuery } from "../../modules/shared/pagination.schema";
// import { toSkipTake } from "../../modules/shared/pagination.schema";
import type { Conversation } from "../../modules/conversation/conversation.types";
export const ConversationRepo = {
  create: async (data: Conversation.Create, userId: string) => {
    const conversation = await prisma.conversation.create({
      data: {
        title: data.title,
        userId,
      },
    });

    return conversation;
  },

  //   getAll: async (userId: string, pagination: PaginationQuery) => {
  //     const { skip, take } = toSkipTake(pagination);
  //     const [documents, total] = await prisma.$transaction([
  //       prisma.document.findMany({
  //         where: {
  //           ownerId: userId,
  //           storageStatus: { in: ["READY", "DELETING"] },
  //         },
  //         orderBy: { createdAt: "desc" },
  //         skip,
  //         take,
  //       }),
  //       prisma.document.count({
  //         where: {
  //           ownerId: userId,
  //           storageStatus: { in: ["READY", "DELETING"] },
  //         },
  //       }),
  //     ]);
  //     return { documents, total };
  //   },
  //   update: async (id: string, data: Document.Update, userId: string) => {
  //     const document = await prisma.document.findFirst({
  //       where: {
  //         id,
  //         ownerId: userId,
  //       },
  //     });

  //     if (!document) {
  //       throw new ApiError({
  //         code: "FORBIDDEN",
  //         message: "You do not have permission to update this document.",
  //       });
  //     }
  //     const update = await prisma.document.update({
  //       where: { id },
  //       data: { ...data },
  //     });
  //     return update;
  //   },

  //   getById: async (id: string, userId: string) => {
  //     const document = await prisma.document.findFirst({
  //       where: { id, ownerId: userId, storageStatus: "READY" },
  //     });

  //     if (!document) {
  //       throw new ApiError({
  //         code: "FORBIDDEN",
  //         message: "You do not have permission to get this document.",
  //       });
  //     }
  //     return document;
  //   },

  //   remove: async (id: string) => {
  //     return prisma.document.delete({
  //       where: { id },
  //     });
  //   },
};
