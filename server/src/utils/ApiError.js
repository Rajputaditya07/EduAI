class ApiError extends Error {
  /**
   * @param {number} statusCode  HTTP status code
   * @param {string} message     Human-readable error message
   * @param {Array}  errors      Optional array of detailed errors
   */
  constructor(statusCode, message = "Something went wrong", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.data = null;

    // Capture a clean stack trace (omits constructor frame)
    Error.captureStackTrace(this, this.constructor);
  }
}

export { ApiError };
