import { Router } from "express";
import auth from "./auth";
import conversation from "./conversation";

const router = Router();

router.use("/auth", auth);
router.use("/conversation", conversation);

export default router;
