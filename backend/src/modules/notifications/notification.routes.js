import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { sseStreamHandler } from "./sse.handler.js";
import {
  getNotifications,
  markRead,
  markAllRead,
} from "./notification.controller.js";

const router = Router();

// SSE stream does its own auth via ?token= query param (EventSource can't send headers)
router.get("/stream", sseStreamHandler);

// All other routes require JWT
router.use(verifyJWT);
router.get("/", getNotifications);
router.patch("/read-all", markAllRead); // must come before /:id
router.patch("/:id/read", markRead);

export default router;
