import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import User from "../users/user.model.js";
import Classroom from "../classrooms/classroom.model.js";
import Assignment from "../assignments/assignment.model.js";
import Submission from "../submissions/submission.model.js";

const router = Router();

router.use(verifyJWT, authorizeRoles("admin"));

// ── GET /users ──────────────────────────────────────────────────
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { role, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -refreshToken")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(200, {
        users,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      })
    );
  })
);

// ── PATCH /users/:id/role ───────────────────────────────────────
router.patch(
  "/users/:id/role",
  asyncHandler(async (req, res) => {
    const { role } = req.body;

    if (!["student", "teacher", "admin"].includes(role)) {
      throw new ApiError(400, "Invalid role");
    }

    if (req.user._id.toString() === req.params.id) {
      throw new ApiError(400, "Cannot change your own role");
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) throw new ApiError(404, "User not found");

    if (targetUser.role === "admin") {
      throw new ApiError(400, "Cannot change another admin's role");
    }

    targetUser.role = role;
    await targetUser.save({ validateBeforeSave: false });

    const sanitized = targetUser.toObject();
    delete sanitized.password;
    delete sanitized.refreshToken;

    res
      .status(200)
      .json(new ApiResponse(200, sanitized, "User role updated"));
  })
);

// ── DELETE /users/:id ───────────────────────────────────────────
router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    if (req.user._id.toString() === req.params.id) {
      throw new ApiError(400, "Cannot delete your own account");
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) throw new ApiError(404, "User not found");

    if (targetUser.role === "admin") {
      throw new ApiError(400, "Cannot delete another admin");
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "User deleted"));
  })
);

// ── GET /stats ──────────────────────────────────────────────────
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [
      totalUsers,
      studentCount,
      teacherCount,
      adminCount,
      totalClassrooms,
      activeClassrooms,
      totalAssignments,
      publishedAssignments,
      totalSubmissions,
      gradedSubmissions,
      pendingSubmissions,
      errorSubmissions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "admin" }),
      Classroom.countDocuments(),
      Classroom.countDocuments({ isActive: true }),
      Assignment.countDocuments(),
      Assignment.countDocuments({ status: "published" }),
      Submission.countDocuments(),
      Submission.countDocuments({ status: "graded" }),
      Submission.countDocuments({ status: "pending" }),
      Submission.countDocuments({ status: "error" }),
    ]);

    const gradingSuccessRate =
      gradedSubmissions + errorSubmissions > 0
        ? Math.round(
            (gradedSubmissions / (gradedSubmissions + errorSubmissions)) * 100
          )
        : 100;

    res.status(200).json(
      new ApiResponse(200, {
        totalUsers,
        studentCount,
        teacherCount,
        adminCount,
        totalClassrooms,
        activeClassrooms,
        totalAssignments,
        publishedAssignments,
        totalSubmissions,
        gradedSubmissions,
        pendingSubmissions,
        gradingSuccessRate,
      })
    );
  })
);

export default router;
