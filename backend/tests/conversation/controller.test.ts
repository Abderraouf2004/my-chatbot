import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConversationController } from "../../src/core/conversation/controller";
import { ConversationService } from "../../src/core/conversation/service";
import type { Request, Response, NextFunction } from "express";

vi.mock("../../src/core/conversation/service", () => ({
  ConversationService: {
    create: vi.fn(),
    getAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    createmessage: vi.fn(),
    getmessages: vi.fn(),
  },
}));

describe("ConversationController", () => {
  let req: Partial<Request>;
  let res: Response;
  let next: NextFunction;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn().mockReturnThis();

    req = {
      body: {},
      params: { id: "conversation-123" },
      query: { page: "2", limit: "10" },
      user: { id: "user-123" } as Request["user"],
      get: vi.fn().mockReturnValue("idempotency-123"),
    };

    res = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;

    next = vi.fn();
  });

  const execute = async (handler: typeof ConversationController.create) => {
    await handler(req as Request, res as Response, next);
  };

  describe("create", () => {
    it("should create a conversation and return 201", async () => {
      const data = { id: "conversation-123", title: "Test" };
      req.body = { title: "Test" };

      vi.mocked(ConversationService.create).mockResolvedValue(data as never);

      await execute(ConversationController.create);

      expect(ConversationService.create).toHaveBeenCalledWith(
        req.body,
        "user-123",
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        data,
        message: "Conversation created successfully",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should pass errors to next", async () => {
      const error = new Error("Create failed");
      vi.mocked(ConversationService.create).mockRejectedValue(error);

      await execute(ConversationController.create);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getAll", () => {
    it("should retrieve conversations and return 200", async () => {
      const result = {
        data: [{ id: "conversation-123", title: "Test" }],
        meta: { page: 2, limit: 10, total: 1 },
      };

      vi.mocked(ConversationService.getAll).mockResolvedValue(result as never);

      await execute(ConversationController.getAll);

      expect(ConversationService.getAll).toHaveBeenCalledWith(
        "user-123",
        req.query,
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        ...result,
        message: "Conversations retrieved successfully",
      });
    });

    it("should pass errors to next", async () => {
      const error = new Error("Get all failed");
      vi.mocked(ConversationService.getAll).mockRejectedValue(error);

      await execute(ConversationController.getAll);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("update", () => {
    it("should update a conversation and return 200", async () => {
      const data = { id: "conversation-123", title: "Updated" };
      req.body = { title: "Updated" };

      vi.mocked(ConversationService.update).mockResolvedValue(data as never);

      await execute(ConversationController.update);

      expect(ConversationService.update).toHaveBeenCalledWith(
        "conversation-123",
        req.body,
        "user-123",
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        data,
        message: "Conversation updated successfully",
      });
    });

    it("should pass errors to next", async () => {
      const error = new Error("Update failed");
      vi.mocked(ConversationService.update).mockRejectedValue(error);

      await execute(ConversationController.update);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("delete", () => {
    it("should delete a conversation and return 200", async () => {
      const data = { success: true };

      vi.mocked(ConversationService.delete).mockResolvedValue(data);

      await execute(ConversationController.delete);

      expect(ConversationService.delete).toHaveBeenCalledWith(
        "conversation-123",
        "user-123",
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        data,
        message: "Conversation deleted successfully",
      });
    });

    it("should pass errors to next", async () => {
      const error = new Error("Delete failed");
      vi.mocked(ConversationService.delete).mockRejectedValue(error);

      await execute(ConversationController.delete);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getById", () => {
    it("should retrieve one conversation and return 200", async () => {
      const data = { id: "conversation-123", title: "Test" };

      vi.mocked(ConversationService.getById).mockResolvedValue(data as never);

      await execute(ConversationController.getById);

      expect(ConversationService.getById).toHaveBeenCalledWith(
        "conversation-123",
        "user-123",
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        data,
        message: "Conversation retrieved successfully",
      });
    });

    it("should pass errors to next", async () => {
      const error = new Error("Get by ID failed");
      vi.mocked(ConversationService.getById).mockRejectedValue(error);

      await execute(ConversationController.getById);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("createmessage", () => {
    it("should create a message and return 201", async () => {
      const data = {
        userMessage: { content: "Hello", role: "user" },
        assistantMessage: { content: "Hi", role: "assistant" },
      };
      req.body = { content: "Hello" };

      vi.mocked(ConversationService.createmessage).mockResolvedValue(
        data as never,
      );

      await execute(ConversationController.createmessage);

      expect(ConversationService.createmessage).toHaveBeenCalledWith(
        "conversation-123",
        req.body,
        "user-123",
        "idempotency-123",
      );
      expect(req.get).toHaveBeenCalledWith("Idempotency-Key");
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        data,
        message: "Message created successfully",
      });
    });

    it("should pass errors to next", async () => {
      const error = new Error("Create message failed");
      vi.mocked(ConversationService.createmessage).mockRejectedValue(error);

      await execute(ConversationController.createmessage);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getmessages", () => {
    it("should retrieve messages and return 200", async () => {
      const result = {
        data: [{ content: "Hello", role: "user" }],
        meta: { page: 2, limit: 10, total: 1 },
      };

      vi.mocked(ConversationService.getmessages).mockResolvedValue(
        result as never,
      );

      await execute(ConversationController.getmessages);

      expect(ConversationService.getmessages).toHaveBeenCalledWith(
        "conversation-123",
        req.query,
        "user-123",
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        ...result,
        message: "messages retrieved successfully",
      });
    });

    it("should pass errors to next", async () => {
      const error = new Error("Get messages failed");
      vi.mocked(ConversationService.getmessages).mockRejectedValue(error);

      await execute(ConversationController.getmessages);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
