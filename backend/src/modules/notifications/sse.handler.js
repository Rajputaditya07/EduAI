/**
 * Server-Sent Events (SSE) handler.
 * Maintains a map of active connections keyed by userId string.
 */
import jwt from "jsonwebtoken";
import User from "../users/user.model.js";

/** @type {Map<string, import('express').Response>} */
const activeConnections = new Map();

/**
 * Push an SSE event to a specific user (if connected).
 */
const sendSSEEvent = (userId, eventType, data) => {
  const id = userId.toString();
  const res = activeConnections.get(id);
  if (res) {
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
  }
};

/**
 * Express handler for the SSE stream endpoint.
 * Authenticates via ?token= query param since EventSource cannot send headers.
 */
const sseStreamHandler = async (req, res) => {
  // EventSource cannot send Authorization header, so accept token as query param
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Token required for SSE" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }

  const user = await User.findById(decoded._id);
  if (!user) {
    return res.status(401).json({ success: false, message: "User not found" });
  }

  const userId = user._id.toString();

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Register connection
  activeConnections.set(userId, res);

  // Send initial connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ message: "SSE connected" })}\n\n`);

  // Keep-alive ping every 30 seconds (keeps Render connection alive)
  const pingInterval = setInterval(() => {
    res.write(": ping\n\n");
  }, 30_000);

  // Clean up on disconnect
  req.on("close", () => {
    activeConnections.delete(userId);
    clearInterval(pingInterval);
  });
};

export { activeConnections, sendSSEEvent, sseStreamHandler };
