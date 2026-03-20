/**
 * Wraps an async Express route handler so that any rejected
 * promise is automatically forwarded to the global error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { asyncHandler };
