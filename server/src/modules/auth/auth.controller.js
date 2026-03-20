import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "./auth.service.js";

// ── Cookie options ──────────────────────────────────────────────
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ── Register ────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await registerUser(name, email, password, role);

  res
    .status(201)
    .json(new ApiResponse(201, user, "User registered successfully"));
});

// ── Login ───────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await loginUser(email, password);

  res
    .status(200)
    .cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS)
    .json(
      new ApiResponse(200, { accessToken, user }, "Logged in successfully")
    );
});

// ── Refresh Token ───────────────────────────────────────────────
const refresh = asyncHandler(async (req, res) => {
  const incomingToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  const { accessToken, refreshToken } =
    await refreshAccessToken(incomingToken);

  res
    .status(200)
    .cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS)
    .json(
      new ApiResponse(200, { accessToken }, "Access token refreshed")
    );
});

// ── Logout ──────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.user._id);

  res
    .status(200)
    .clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

export { register, login, refresh, logout };
