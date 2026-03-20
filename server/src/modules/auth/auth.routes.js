import { Router } from "express";
import { body, validationResult } from "express-validator";
import { ApiError } from "../../utils/ApiError.js";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { register, login, refresh, logout } from "./auth.controller.js";

const router = Router();

// ── Validation middleware runner ────────────────────────────────
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(
      400,
      "Validation failed",
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
};

// ── Routes ──────────────────────────────────────────────────────
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .optional()
      .isIn(["student", "teacher"])
      .withMessage("Role must be student or teacher"),
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.post("/refresh", refresh);

router.post("/logout", verifyJWT, logout);

export default router;
