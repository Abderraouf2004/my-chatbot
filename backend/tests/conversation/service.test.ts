import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/core/conversation/repo", () => ({
  ConversationRepo: {
    create: vi.fn(),
    getAll: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getById: vi.fn(),
    createmessage: vi.fn(),
    getAssistantMessage: vi.fn(),
    createAssistantMessage: vi.fn(),
    getmessages: vi.fn(),
  },
}));

vi.mock("../../src/services/gemini", () => ({
  generateResponse: vi.fn(),
}));

vi.mock("../../src/modules/shared/pagination.schema", () => ({
  buildPaginationMeta: vi.fn(),
  toSkipTake: vi.fn(),
}));

import { ConversationService } from "../../src/core/conversation/service";
import { ConversationRepo } from "../../src/core/conversation/repo";
import { generateResponse } from "../../src/services/gemini";
import { buildPaginationMeta } from "../../src/modules/shared/pagination.schema";

const mockedRepo = vi.mocked(ConversationRepo);
const mockedGemini = vi.mocked(generateResponse);
const mockedPaginationMeta = vi.mocked(buildPaginationMeta);

const conversationId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const messageId = "33333333-3333-4333-8333-333333333333";
const assistantMessageId = "44444444-4444-4444-8444-444444444444";

const createdAt = new Date("2026-01-01T10:00:00.000Z");
const updatedAt = new Date("2026-01-02T10:00:00.000Z");

const validConversation = {
  id: conversationId,
  title: "Test Conversation",
  userId,
  createdAt,
  updatedAt,
};

const validUserMessage = {
  id: messageId,
  conversationId,
  role: "user",
  content: "Hello AI",
  createdAt,
};

const validAssistantMessage = {
  id: assistantMessageId,
  conversationId,
  role: "assistant",
  content: "Hello! How can I help you?",
  createdAt,
};

const pagination = {
  page: 1,
  limit: 10,
};

describe("ConversationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a conversation successfully", async () => {
      mockedRepo.create.mockResolvedValue(validConversation as never);

      const result = await ConversationService.create(
        { title: "Test Conversation" },
        userId,
      );

      expect(mockedRepo.create).toHaveBeenCalledWith(
        { title: "Test Conversation" },
        userId,
      );

      expect(result).toEqual(validConversation);
    });

    it("should reject when returned conversation DTO is invalid", async () => {
      mockedRepo.create.mockResolvedValue({
        ...validConversation,
        id: "invalid-id",
      } as never);

      await expect(
        ConversationService.create({ title: "Test Conversation" }, userId),
      ).rejects.toBeDefined();
    });

    it("should propagate repository errors", async () => {
      mockedRepo.create.mockRejectedValue(new Error("Database error"));

      await expect(
        ConversationService.create({ title: "Test Conversation" }, userId),
      ).rejects.toThrow("Database error");
    });
  });

  describe("getAll", () => {
    it("should retrieve conversations with pagination metadata", async () => {
      mockedRepo.getAll.mockResolvedValue({
        conversations: [validConversation],
        total: 1,
      } as never);

      mockedPaginationMeta.mockReturnValue({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      } as never);

      const result = await ConversationService.getAll(userId, pagination);

      expect(mockedRepo.getAll).toHaveBeenCalledWith(userId, pagination);

      expect(result.data).toEqual([validConversation]);

      expect(mockedPaginationMeta).toHaveBeenCalledWith(1, pagination);

      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it("should return an empty list when there are no conversations", async () => {
      mockedRepo.getAll.mockResolvedValue({
        conversations: [],
        total: 0,
      } as never);

      mockedPaginationMeta.mockReturnValue({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      } as never);

      const result = await ConversationService.getAll(userId, pagination);

      expect(result.data).toEqual([]);
      expect(result.meta).toBeDefined();
    });

    it("should reject when a conversation DTO is invalid", async () => {
      mockedRepo.getAll.mockResolvedValue({
        conversations: [
          {
            ...validConversation,
            id: "invalid-id",
          },
        ],
        total: 1,
      } as never);

      await expect(
        ConversationService.getAll(userId, pagination),
      ).rejects.toBeDefined();
    });

    it("should propagate repository errors", async () => {
      mockedRepo.getAll.mockRejectedValue(new Error("Database error"));

      await expect(
        ConversationService.getAll(userId, pagination),
      ).rejects.toThrow("Database error");
    });
  });

  describe("update", () => {
    it("should update a conversation successfully", async () => {
      const updatedConversation = {
        ...validConversation,
        title: "Updated Conversation",
      };

      mockedRepo.update.mockResolvedValue(updatedConversation as never);

      const result = await ConversationService.update(
        conversationId,
        { title: "Updated Conversation" },
        userId,
      );

      expect(mockedRepo.update).toHaveBeenCalledWith(
        conversationId,
        { title: "Updated Conversation" },
        userId,
      );

      expect(result).toEqual(updatedConversation);
    });

    it("should reject when returned conversation DTO is invalid", async () => {
      mockedRepo.update.mockResolvedValue({
        ...validConversation,
        id: "invalid-id",
      } as never);

      await expect(
        ConversationService.update(
          conversationId,
          { title: "Updated Conversation" },
          userId,
        ),
      ).rejects.toBeDefined();
    });

    it("should propagate repository errors", async () => {
      mockedRepo.update.mockRejectedValue(new Error("Update failed"));

      await expect(
        ConversationService.update(
          conversationId,
          { title: "Updated Conversation" },
          userId,
        ),
      ).rejects.toThrow("Update failed");
    });
  });

  describe("delete", () => {
    it("should delete a conversation successfully", async () => {
      mockedRepo.remove.mockResolvedValue(validConversation as never);

      const result = await ConversationService.delete(conversationId, userId);

      expect(mockedRepo.remove).toHaveBeenCalledWith(conversationId, userId);

      expect(result).toEqual({ success: true });
    });

    it("should propagate repository errors", async () => {
      mockedRepo.remove.mockRejectedValue(new Error("Delete failed"));

      await expect(
        ConversationService.delete(conversationId, userId),
      ).rejects.toThrow("Delete failed");
    });
  });

  describe("getById", () => {
    it("should retrieve a conversation successfully", async () => {
      mockedRepo.getById.mockResolvedValue(validConversation as never);

      const result = await ConversationService.getById(conversationId, userId);

      expect(mockedRepo.getById).toHaveBeenCalledWith(conversationId, userId);

      expect(result).toEqual(validConversation);
    });

    it("should reject when returned conversation DTO is invalid", async () => {
      mockedRepo.getById.mockResolvedValue({
        ...validConversation,
        id: "invalid-id",
      } as never);

      await expect(
        ConversationService.getById(conversationId, userId),
      ).rejects.toBeDefined();
    });

    it("should propagate repository errors", async () => {
      mockedRepo.getById.mockRejectedValue(new Error("Conversation not found"));

      await expect(
        ConversationService.getById(conversationId, userId),
      ).rejects.toThrow("Conversation not found");
    });
  });

  describe("createmessage", () => {
    const idempotencyKey = "test-key-123";

    it("should create user and assistant messages successfully", async () => {
      mockedRepo.createmessage.mockResolvedValue(validUserMessage as never);

      mockedRepo.getAssistantMessage.mockResolvedValue(null as never);

      mockedGemini.mockResolvedValue("Hello! How can I help you?");

      mockedRepo.createAssistantMessage.mockResolvedValue(
        validAssistantMessage as never,
      );

      const result = await ConversationService.createmessage(
        conversationId,
        { content: "Hello AI" },
        userId,
        idempotencyKey,
      );

      expect(mockedRepo.createmessage).toHaveBeenCalledWith(
        conversationId,
        { content: "Hello AI" },
        userId,
        idempotencyKey,
      );

      expect(mockedGemini).toHaveBeenCalledWith("Hello AI");

      expect(mockedRepo.createAssistantMessage).toHaveBeenCalledWith(
        conversationId,
        "Hello! How can I help you?",
        idempotencyKey,
      );

      expect(result).toEqual({
        userMessage: validUserMessage,
        assistantMessage: validAssistantMessage,
      });
    });

    it("should reuse an existing assistant message without calling Gemini", async () => {
      mockedRepo.createmessage.mockResolvedValue(validUserMessage as never);

      mockedRepo.getAssistantMessage.mockResolvedValue(
        validAssistantMessage as never,
      );

      const result = await ConversationService.createmessage(
        conversationId,
        { content: "Hello AI" },
        userId,
        idempotencyKey,
      );

      expect(mockedRepo.getAssistantMessage).toHaveBeenCalledWith(
        conversationId,
        idempotencyKey,
      );

      expect(mockedGemini).not.toHaveBeenCalled();
      expect(mockedRepo.createAssistantMessage).not.toHaveBeenCalled();

      expect(result.assistantMessage).toEqual(validAssistantMessage);
    });

    it("should reject when Gemini generation fails", async () => {
      mockedRepo.createmessage.mockResolvedValue(validUserMessage as never);

      mockedRepo.getAssistantMessage.mockResolvedValue(null as never);

      mockedGemini.mockRejectedValue(new Error("Gemini API failed"));

      await expect(
        ConversationService.createmessage(
          conversationId,
          { content: "Hello AI" },
          userId,
          idempotencyKey,
        ),
      ).rejects.toThrow("Gemini API failed");

      expect(mockedRepo.createAssistantMessage).not.toHaveBeenCalled();
    });

    it("should reject when assistant message creation fails", async () => {
      mockedRepo.createmessage.mockResolvedValue(validUserMessage as never);

      mockedRepo.getAssistantMessage.mockResolvedValue(null as never);

      mockedGemini.mockResolvedValue("AI response");

      mockedRepo.createAssistantMessage.mockRejectedValue(
        new Error("Assistant message creation failed"),
      );

      await expect(
        ConversationService.createmessage(
          conversationId,
          { content: "Hello AI" },
          userId,
          idempotencyKey,
        ),
      ).rejects.toThrow("Assistant message creation failed");
    });

    it("should reject when user message DTO is invalid", async () => {
      mockedRepo.createmessage.mockResolvedValue({
        ...validUserMessage,
        id: "invalid-id",
      } as never);

      mockedRepo.getAssistantMessage.mockResolvedValue(
        validAssistantMessage as never,
      );

      await expect(
        ConversationService.createmessage(
          conversationId,
          { content: "Hello AI" },
          userId,
          idempotencyKey,
        ),
      ).rejects.toBeDefined();
    });

    it("should reject when assistant message DTO is invalid", async () => {
      mockedRepo.createmessage.mockResolvedValue(validUserMessage as never);

      mockedRepo.getAssistantMessage.mockResolvedValue(null as never);

      mockedGemini.mockResolvedValue("AI response");

      mockedRepo.createAssistantMessage.mockResolvedValue({
        ...validAssistantMessage,
        id: "invalid-id",
      } as never);

      await expect(
        ConversationService.createmessage(
          conversationId,
          { content: "Hello AI" },
          userId,
          idempotencyKey,
        ),
      ).rejects.toBeDefined();
    });

    it("should propagate repository errors", async () => {
      mockedRepo.createmessage.mockRejectedValue(
        new Error("Message creation failed"),
      );

      await expect(
        ConversationService.createmessage(
          conversationId,
          { content: "Hello AI" },
          userId,
          idempotencyKey,
        ),
      ).rejects.toThrow("Message creation failed");

      expect(mockedGemini).not.toHaveBeenCalled();
    });
  });

  describe("getmessages", () => {
    it("should retrieve messages with pagination metadata", async () => {
      mockedRepo.getmessages.mockResolvedValue({
        messages: [validUserMessage, validAssistantMessage],
        total: 2,
      } as never);

      mockedPaginationMeta.mockReturnValue({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      } as never);

      const result = await ConversationService.getmessages(
        conversationId,
        pagination,
        userId,
      );

      expect(mockedRepo.getmessages).toHaveBeenCalledWith(
        conversationId,
        pagination,
        userId,
      );

      expect(result.data).toEqual([validUserMessage, validAssistantMessage]);

      expect(mockedPaginationMeta).toHaveBeenCalledWith(2, pagination);
    });

    it("should return an empty list when there are no messages", async () => {
      mockedRepo.getmessages.mockResolvedValue({
        messages: [],
        total: 0,
      } as never);

      mockedPaginationMeta.mockReturnValue({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      } as never);

      const result = await ConversationService.getmessages(
        conversationId,
        pagination,
        userId,
      );

      expect(result.data).toEqual([]);
      expect(result.meta).toBeDefined();
    });

    it("should reject when a message DTO is invalid", async () => {
      mockedRepo.getmessages.mockResolvedValue({
        messages: [
          {
            ...validUserMessage,
            id: "invalid-id",
          },
        ],
        total: 1,
      } as never);

      await expect(
        ConversationService.getmessages(conversationId, pagination, userId),
      ).rejects.toBeDefined();
    });

    it("should propagate repository errors", async () => {
      mockedRepo.getmessages.mockRejectedValue(
        new Error("Message retrieval failed"),
      );

      await expect(
        ConversationService.getmessages(conversationId, pagination, userId),
      ).rejects.toThrow("Message retrieval failed");
    });
  });
});
