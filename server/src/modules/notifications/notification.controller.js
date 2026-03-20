import Notification from "./notification.model.js";
import { sendSSEEvent } from "./sse.handler.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// ── Create & push (used by other modules) ───────────────────────
const createAndSend = async (userId, type, message, link = "") => {
  const notification = await Notification.create({
    user: userId,
    type,
    message,
    link,
  });

  sendSSEEvent(userId, type, {
    _id: notification._id,
    type,
    message,
    link,
    isRead: false,
    createdAt: notification.createdAt,
  });

  return notification;
};

// ── GET / — last 50 notifications ───────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.status(200).json(new ApiResponse(200, notifications));
});

// ── PATCH /:id/read ─────────────────────────────────────────────
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json(new ApiResponse(404, null, "Not found"));
  }

  res.status(200).json(new ApiResponse(200, notification, "Marked as read"));
});

// ── PATCH /read-all ─────────────────────────────────────────────
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
});

export { createAndSend, getNotifications, markRead, markAllRead };
