import { prisma } from "../../services/prisma";
import { ApiError } from "../../errors/api-error";
import type { PaginationQuery } from "../../modules/shared/pagination.schema";
import { toSkipTake } from "../../modules/shared/pagination.schema";
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

  getAll: async (userId: string, pagination: PaginationQuery) => {
    const { skip, take } = toSkipTake(pagination);
    const [conversations, total] = await prisma.$transaction([
      prisma.conversation.findMany({
        where: {
          userId: userId,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.conversation.count({
        where: {
          userId: userId,
        },
      }),
    ]);
    return { conversations, total };
  },
  update: async (id: string, data: Conversation.Update, userId: string) => {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: userId,
      },
    });

    if (!conversation) {
      throw new ApiError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this conversation.",
      });
    }
    const update = await prisma.conversation.update({
      where: { id },
      data: { ...data },
    });
    return update;
  },

  getById: async (id: string, userId: string) => {
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      throw new ApiError({
        code: "FORBIDDEN",
        message: "You do not have permission to get this conversation.",
      });
    }
    return conversation;
  },

  remove: async (id: string, userId: string) => {
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      throw new ApiError({
        code: "FORBIDDEN",
        message: "You do not have permission to delete  this conversation.",
      });
    }
    return prisma.conversation.delete({
      where: { id },
    });
  },
  createmessage: async (
    id: string,
    data: Conversation.CreateMessage,
    userId: string,
  ) => {
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "this conversation is not exist!",
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        role: "user",
        content: data.content,
      },
    });
    return message;
  },
  getmessages: async (Id: string, pagination: PaginationQuery) => {
    const { skip, take } = toSkipTake(pagination);
    const [messages, total] = await prisma.$transaction([
      prisma.message.findMany({
        where: {
          conversationId: Id,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.message.count({
        where: {
          conversationId: Id,
        },
      }),
    ]);
    return { messages, total };
  },
};
