import { Router } from "express";
import { validateRequestInput } from "../../errors/validate-request-input";
import { signinSchema, signupSchema } from "../../modules/auth/auth.schema";
import { AuthController } from "../../core/auth/controller";
import {
  refreshLimiter,
  signinLimiter,
  signupLimiter,
} from "../../middleware/rate-limit";
const auth = Router();

auth.get("/verify", AuthController.verifyToken);

auth.post("/signout", AuthController.signOut);

auth.post("/refresh", refreshLimiter, AuthController.refresh);

auth.post(
  "/signup",
  validateRequestInput({ body: signupSchema }),
  signupLimiter,
  AuthController.signup,
);

auth.post(
  "/signin",
  validateRequestInput({ body: signinSchema }),
  signinLimiter,
  AuthController.signin,
);
export default auth;
