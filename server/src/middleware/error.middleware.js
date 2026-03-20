import { ApiError } from "../utils/ApiError.js";

/**
 * Global Express error handler (4-argument signature).
 * Must be registered LAST via app.use().
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
    });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

export { errorHandler };
