export namespace Conversation {
  export interface Create {
    title: string;
  }

  export interface DTO {
    id: string;
    title: string;
    userId: string;
    updatedAt: Date;
    createdAt: Date;
  }

  export interface Update {
    title?: string;
  }
  enum Role {
    user,
    assistant,
  }
  export interface CreateMessage {
    content: string;
  }

  export interface DTOMessage {
    id: string;
    conversationId: string;
    role: Role;
    content: string;
    createdAt: Date;
  }
}
