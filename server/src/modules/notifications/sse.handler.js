/**
 * Server-Sent Events (SSE) handler.
 * Maintains a map of active connections keyed by userId string.
 */

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
 * Requires verifyJWT middleware to have run first.
 */
const sseStreamHandler = (req, res) => {
  const userId = req.user._id.toString();

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
