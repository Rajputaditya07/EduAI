import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import Submission from "../submissions/submission.model.js";
import { gradeSubmission } from "./grading.service.js";

const router = Router();

router.use(verifyJWT);

/**
 * POST /retry/:submissionId — teacher manually re-triggers grading
 */
router.post(
  "/retry/:submissionId",
  authorizeRoles("teacher"),
  asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.submissionId).populate("assignment", "teacher");

    if (!submission) throw new ApiError(404, "Submission not found");
    if (submission.assignment.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Only the assignment teacher can retry grading");
    }
    if (submission.status !== "error") {
      throw new ApiError(400, "Only submissions with 'error' status can be retried");
    }

    submission.status = "pending";
    await submission.save();

    // Fire-and-forget
    gradeSubmission(submission._id).catch((err) =>
      console.error("Retry grading failed:", err.message)
    );

    res
      .status(200)
      .json(new ApiResponse(200, null, "Grading retry initiated"));
  })
);

export default router;
