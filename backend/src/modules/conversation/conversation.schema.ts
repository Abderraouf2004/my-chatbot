import Joi from "joi";

export const IdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const CreateConversationSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
});

export const UpdateConversationSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
});
export const ConversationDTOSchema = Joi.object({
  id: Joi.string().uuid().required(),
  title: Joi.string().min(2).max(100).required(),
  userId: Joi.string().uuid().required(),
  updatedAt: Joi.date().required(),
  createdAt: Joi.date().required(),
});

export const MessageDTOSchema = Joi.object({
  id: Joi.string().uuid().required(),
  conversationId: Joi.string().uuid().required(),
  role: Joi.string().required(),
  content: Joi.string().min(2).required(),
  createdAt: Joi.date().required(),
});

export const CreateMessageSchema = Joi.object({
  content: Joi.string().min(2).required(),
});
