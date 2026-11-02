import Joi from "joi";

export const signupSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().max(254).required(),
  password: Joi.string().min(8).max(128).required(),
}).required();

export const signinSchema = Joi.object({
  email: Joi.string().email().max(254).required(),
  password: Joi.string().min(8).max(128).required(),
}).required();

export const RefreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
