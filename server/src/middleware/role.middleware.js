import { ApiError } from "../utils/ApiError.js";

/**
 * Factory: returns middleware that restricts access to the listed roles.
 * Usage: authorizeRoles('teacher', 'admin')
 */
const authorizeRoles = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action"
      );
    }
    next();
  };
};

export { authorizeRoles };
