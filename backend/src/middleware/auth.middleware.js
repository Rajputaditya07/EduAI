import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../modules/users/user.model.js";

/**
 * Middleware: verify access token from Authorization header.
 * Attaches decoded user (without password/refreshToken) to req.user.
 */
const verifyJWT = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Unauthorized — no token provided");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Unauthorized — invalid or expired token");
  }

  const user = await User.findById(decoded._id);

  if (!user) {
    throw new ApiError(401, "Unauthorized — user not found");
  }

  req.user = user;
  next();
});

export { verifyJWT };
