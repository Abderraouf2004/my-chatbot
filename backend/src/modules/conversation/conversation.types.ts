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
    description?: string;
  }
}
