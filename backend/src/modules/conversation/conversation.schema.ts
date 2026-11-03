import Joi from "joi";

export const IdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const IdempotencyKeySchema = Joi.object({
  "idempotency-key": Joi.string()
    .pattern(/^[a-zA-Z0-9_-]{1,100}$/)
    .required(),
}).unknown(true);

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

export const CreateConversationSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
}).required();

export const UpdateConversationSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
}).required();

export const CreateMessageSchema = Joi.object({
  content: Joi.string().min(2).max(4000).required(),
}).required();
