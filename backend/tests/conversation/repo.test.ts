import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/services/prisma", () => ({
  prisma: {
    conversation: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { ConversationRepo } from "../../src/core/conversation/repo";
import { prisma } from "../../src/services/prisma";

const mockedPrisma = vi.mocked(prisma, true);
const conversationId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const messageId = "33333333-3333-4333-8333-333333333333";

const createdAt = new Date("2026-01-01T10:00:00.000Z");
const updatedAt = new Date("2026-01-02T10:00:00.000Z");

const validConversation = {
  id: conversationId,
  title: "Test Conversation",
  userId,
  createdAt,
  updatedAt,
};

const validMessage = {
  id: messageId,
  conversationId,
  role: "user",
  content: "Hello AI",
  idempotencyKey: "test-key-123",
  createdAt,
};

const pagination = {
  page: 2,
  limit: 5,
};

const idempotencyKey = "test-key-123";

describe("ConversationRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a conversation successfully", async () => {
      mockedPrisma.conversation.create.mockResolvedValue(
        validConversation as never,
      );

      const result = await ConversationRepo.create(
        { title: "Test Conversation" },
        userId,
      );

      expect(mockedPrisma.conversation.create).toHaveBeenCalledWith({
        data: {
          title: "Test Conversation",
          userId,
        },
      });

      expect(result).toEqual(validConversation);
    });

    it("should propagate database errors", async () => {
      mockedPrisma.conversation.create.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        ConversationRepo.create({ title: "Test Conversation" }, userId),
      ).rejects.toThrow("Database error");
    });
  });

  describe("getAll", () => {
    it("should retrieve conversations with pagination", async () => {
      mockedPrisma.conversation.findMany.mockResolvedValue([
        validConversation,
      ] as never);

      mockedPrisma.conversation.count.mockResolvedValue(1 as never);

      mockedPrisma.$transaction.mockResolvedValue([
        [validConversation],
        1,
      ] as never);

      const result = await ConversationRepo.getAll(userId, pagination);

      expect(mockedPrisma.conversation.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: 5,
        take: 5,
      });

      expect(mockedPrisma.conversation.count).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(mockedPrisma.$transaction).toHaveBeenCalled();

      expect(result).toEqual({
        conversations: [validConversation],
        total: 1,
      });
    });

    it("should return an empty result when there are no conversations", async () => {
      mockedPrisma.$transaction.mockResolvedValue([[], 0] as never);

      const result = await ConversationRepo.getAll(userId, pagination);

      expect(result).toEqual({
        conversations: [],
        total: 0,
      });
    });

    it("should propagate transaction errors", async () => {
      mockedPrisma.$transaction.mockRejectedValue(
        new Error("Transaction failed"),
      );

      await expect(ConversationRepo.getAll(userId, pagination)).rejects.toThrow(
        "Transaction failed",
      );
    });
  });

  describe("update", () => {
    it("should update a conversation successfully", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      const updatedConversation = {
        ...validConversation,
        title: "Updated Conversation",
      };

      mockedPrisma.conversation.update.mockResolvedValue(
        updatedConversation as never,
      );

      const result = await ConversationRepo.update(
        conversationId,
        { title: "Updated Conversation" },
        userId,
      );

      expect(mockedPrisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          id: conversationId,
          userId,
        },
      });

      expect(mockedPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: { title: "Updated Conversation" },
      });

      expect(result).toEqual(updatedConversation);
    });

    it("should reject when conversation does not belong to user", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(null as never);

      await expect(
        ConversationRepo.update(
          conversationId,
          { title: "Updated Conversation" },
          userId,
        ),
      ).rejects.toMatchObject({
        message: "You do not have permission to update this conversation.",
      });

      expect(mockedPrisma.conversation.update).not.toHaveBeenCalled();
    });

    it("should propagate database update errors", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      mockedPrisma.conversation.update.mockRejectedValue(
        new Error("Update failed"),
      );

      await expect(
        ConversationRepo.update(
          conversationId,
          { title: "Updated Conversation" },
          userId,
        ),
      ).rejects.toThrow("Update failed");
    });
  });

  describe("getById", () => {
    it("should retrieve a conversation belonging to the user", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      const result = await ConversationRepo.getById(conversationId, userId);

      expect(mockedPrisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          id: conversationId,
          userId,
        },
      });

      expect(result).toEqual(validConversation);
    });

    it("should reject when conversation does not belong to user", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(null as never);

      await expect(
        ConversationRepo.getById(conversationId, userId),
      ).rejects.toMatchObject({
        message: "You do not have permission to get this conversation.",
      });
    });

    it("should propagate database errors", async () => {
      mockedPrisma.conversation.findFirst.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        ConversationRepo.getById(conversationId, userId),
      ).rejects.toThrow("Database error");
    });
  });

  describe("remove", () => {
    it("should delete a conversation belonging to the user", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      mockedPrisma.conversation.delete.mockResolvedValue(
        validConversation as never,
      );

      const result = await ConversationRepo.remove(conversationId, userId);

      expect(mockedPrisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          id: conversationId,
          userId,
        },
      });

      expect(mockedPrisma.conversation.delete).toHaveBeenCalledWith({
        where: { id: conversationId },
      });

      expect(result).toEqual(validConversation);
    });

    it("should reject when conversation does not belong to user", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(null as never);

      await expect(
        ConversationRepo.remove(conversationId, userId),
      ).rejects.toMatchObject({
        message: "You do not have permission to delete  this conversation.",
      });

      expect(mockedPrisma.conversation.delete).not.toHaveBeenCalled();
    });

    it("should propagate database delete errors", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      mockedPrisma.conversation.delete.mockRejectedValue(
        new Error("Delete failed"),
      );

      await expect(
        ConversationRepo.remove(conversationId, userId),
      ).rejects.toThrow("Delete failed");
    });
  });

  describe("createmessage", () => {
    it("should create a user message successfully", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      mockedPrisma.message.create.mockResolvedValue(validMessage as never);

      const result = await ConversationRepo.createmessage(
        conversationId,
        { content: "Hello AI" },
        userId,
        idempotencyKey,
      );

      expect(mockedPrisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          id: conversationId,
          userId,
        },
      });

      expect(mockedPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId,
          role: "user",
          content: "Hello AI",
          idempotencyKey,
        },
      });

      expect(result).toEqual(validMessage);
    });

    it("should reject when conversation does not exist for this user", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(null as never);

      await expect(
        ConversationRepo.createmessage(
          conversationId,
          { content: "Hello AI" },
          userId,
          idempotencyKey,
        ),
      ).rejects.toMatchObject({
        message: "This conversation does not exist!",
      });

      expect(mockedPrisma.message.create).not.toHaveBeenCalled();
    });

    it("should return existing message when duplicate key has same content", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      mockedPrisma.message.create.mockRejectedValue({
        code: "P2002",
      });

      mockedPrisma.message.findUnique.mockResolvedValue(validMessage as never);

      const result = await ConversationRepo.createmessage(
        conversationId,
        { content: "Hello AI" },
        userId,
        idempotencyKey,
      );

      expect(mockedPrisma.message.findUnique).toHaveBeenCalledWith({
        where: {
          conversationId_idempotencyKey_role: {
            conversationId,
            idempotencyKey,
            role: "user",
          },
        },
      });

      expect(result).toEqual(validMessage);
    });

    it("should reject when duplicate key is used with different content", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      mockedPrisma.message.create.mockRejectedValue({
        code: "P2002",
      });

      mockedPrisma.message.findUnique.mockResolvedValue({
        ...validMessage,
        content: "Different content",
      } as never);

      await expect(
        ConversationRepo.createmessage(
          conversationId,
          { content: "Hello AI" },
          userId,
          idempotencyKey,
        ),
      ).rejects.toMatchObject({
        message:
          "This Idempotency-Key was already used with a different request body.",
      });
    });

    it("should rethrow P2002 when existing message cannot be found", async () => {
      const duplicateError = { code: "P2002" };

      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      mockedPrisma.message.create.mockRejectedValue(duplicateError);

      mockedPrisma.message.findUnique.mockResolvedValue(null as never);

      await expect(
        ConversationRepo.createmessage(
          conversationId,
          { content: "Hello AI" },
          userId,
          idempotencyKey,
        ),
      ).rejects.toEqual(duplicateError);
    });

    it("should propagate errors other than P2002", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      mockedPrisma.message.create.mockRejectedValue(
        new Error("Database unavailable"),
      );

      await expect(
        ConversationRepo.createmessage(
          conversationId,
          { content: "Hello AI" },
          userId,
          idempotencyKey,
        ),
      ).rejects.toThrow("Database unavailable");

      expect(mockedPrisma.message.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("createAssistantMessage", () => {
    it("should create an assistant message successfully", async () => {
      const assistantMessage = {
        ...validMessage,
        id: "44444444-4444-4444-8444-444444444444",
        role: "assistant",
        content: "Hello! How can I help you?",
      };

      mockedPrisma.message.create.mockResolvedValue(assistantMessage as never);

      const result = await ConversationRepo.createAssistantMessage(
        conversationId,
        "Hello! How can I help you?",
        idempotencyKey,
      );

      expect(mockedPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId,
          role: "assistant",
          content: "Hello! How can I help you?",
          idempotencyKey,
        },
      });

      expect(result).toEqual(assistantMessage);
    });

    it("should propagate database errors", async () => {
      mockedPrisma.message.create.mockRejectedValue(
        new Error("Assistant creation failed"),
      );

      await expect(
        ConversationRepo.createAssistantMessage(
          conversationId,
          "AI response",
          idempotencyKey,
        ),
      ).rejects.toThrow("Assistant creation failed");
    });
  });

  describe("getAssistantMessage", () => {
    it("should retrieve an existing assistant message", async () => {
      const assistantMessage = {
        ...validMessage,
        role: "assistant",
      };

      mockedPrisma.message.findUnique.mockResolvedValue(
        assistantMessage as never,
      );

      const result = await ConversationRepo.getAssistantMessage(
        conversationId,
        idempotencyKey,
      );

      expect(mockedPrisma.message.findUnique).toHaveBeenCalledWith({
        where: {
          conversationId_idempotencyKey_role: {
            conversationId,
            idempotencyKey,
            role: "assistant",
          },
        },
      });

      expect(result).toEqual(assistantMessage);
    });

    it("should return null when assistant message does not exist", async () => {
      mockedPrisma.message.findUnique.mockResolvedValue(null as never);

      const result = await ConversationRepo.getAssistantMessage(
        conversationId,
        idempotencyKey,
      );

      expect(result).toBeNull();
    });

    it("should propagate database errors", async () => {
      mockedPrisma.message.findUnique.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        ConversationRepo.getAssistantMessage(conversationId, idempotencyKey),
      ).rejects.toThrow("Database error");
    });
  });

  describe("getmessages", () => {
    it("should retrieve messages with pagination", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      mockedPrisma.$transaction.mockResolvedValue([[validMessage], 1] as never);

      const result = await ConversationRepo.getmessages(
        conversationId,
        pagination,
        userId,
      );

      expect(mockedPrisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          id: conversationId,
          userId,
        },
      });

      expect(mockedPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        skip: 5,
        take: 5,
      });

      expect(mockedPrisma.message.count).toHaveBeenCalledWith({
        where: { conversationId },
      });

      expect(result).toEqual({
        messages: [validMessage],
        total: 1,
      });
    });

    it("should reject when user does not own the conversation", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(null as never);

      await expect(
        ConversationRepo.getmessages(conversationId, pagination, userId),
      ).rejects.toMatchObject({
        message: "You do not have permission to access this conversation.",
      });

      expect(mockedPrisma.$transaction).not.toHaveBeenCalled();
    });

    it("should return an empty result when there are no messages", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      mockedPrisma.$transaction.mockResolvedValue([[], 0] as never);

      const result = await ConversationRepo.getmessages(
        conversationId,
        pagination,
        userId,
      );

      expect(result).toEqual({
        messages: [],
        total: 0,
      });
    });

    it("should propagate transaction errors", async () => {
      mockedPrisma.conversation.findFirst.mockResolvedValue(
        validConversation as never,
      );

      mockedPrisma.$transaction.mockRejectedValue(
        new Error("Message transaction failed"),
      );

      await expect(
        ConversationRepo.getmessages(conversationId, pagination, userId),
      ).rejects.toThrow("Message transaction failed");
    });
  });
});
