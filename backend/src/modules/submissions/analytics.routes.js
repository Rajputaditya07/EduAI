import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  getClassroomAnalytics,
  getAssignmentAnalytics,
  getStudentProgress,
} from "./submission.analytics.js";

const router = Router();

router.use(verifyJWT);

router.get(
  "/classroom/:classroomId",
  authorizeRoles("teacher"),
  asyncHandler(async (req, res) => {
    const data = await getClassroomAnalytics(
      req.params.classroomId,
      req.user._id
    );
    res.status(200).json(new ApiResponse(200, data));
  })
);

router.get(
  "/assignment/:assignmentId",
  authorizeRoles("teacher"),
  asyncHandler(async (req, res) => {
    const data = await getAssignmentAnalytics(
      req.params.assignmentId,
      req.user._id
    );
    res.status(200).json(new ApiResponse(200, data));
  })
);

router.get(
  "/my-progress",
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const data = await getStudentProgress(req.user._id);
    res.status(200).json(new ApiResponse(200, data));
  })
);

export default router;
