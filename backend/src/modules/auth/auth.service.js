import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../users/user.model.js";
import { ApiError } from "../../utils/ApiError.js";

// ── Register ────────────────────────────────────────────────────
const registerUser = async (name, email, password, role) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const user = await User.create({ name, email, password, role });

  // Return sanitized user (password & refreshToken are select:false,
  // but the document just created still has them in memory)
  const sanitizedUser = user.toObject();
  delete sanitizedUser.password;
  delete sanitizedUser.refreshToken;

  return sanitizedUser;
};

// ── Login ───────────────────────────────────────────────────────
const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password +refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Hash the refresh token before storing in DB
  user.refreshToken = await bcrypt.hash(refreshToken, 12);
  await user.save({ validateBeforeSave: false });

  const sanitizedUser = user.toObject();
  delete sanitizedUser.password;
  delete sanitizedUser.refreshToken;

  return { accessToken, refreshToken, user: sanitizedUser };
};

// ── Refresh Access Token ────────────────────────────────────────
const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user || !user.refreshToken) {
    throw new ApiError(401, "Invalid refresh token — user not found or logged out");
  }

  // Compare incoming token against stored hash
  const isValid = await bcrypt.compare(incomingRefreshToken, user.refreshToken);
  if (!isValid) {
    throw new ApiError(401, "Refresh token has been revoked");
  }

  // Rotate tokens
  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  user.refreshToken = await bcrypt.hash(newRefreshToken, 12);
  await user.save({ validateBeforeSave: false });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, userId: user._id };
};

// ── Logout ──────────────────────────────────────────────────────
const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

export { registerUser, loginUser, refreshAccessToken, logoutUser };
