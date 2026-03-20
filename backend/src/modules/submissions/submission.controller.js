import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { uploadToCloudinary } from "../../config/cloudinary.js";
import {
  createSubmission,
  getSubmissionsByAssignment,
  getMySubmission,
  getSubmissionById,
  getAllStudentSubmissions,
} from "./submission.service.js";

/**
 * Map mimetype to our fileType enum value.
 */
const mimeToFileType = (mimetype) => {
  if (mimetype === "application/pdf") return "pdf";
  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  if (mimetype.startsWith("image/")) return "image";
  return "pdf";
};

// ── POST / — submit ─────────────────────────────────────────────
const submit = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "File is required");
  }

  const { assignmentId } = req.body;
  if (!assignmentId) {
    throw new ApiError(400, "assignmentId is required in the request body");
  }

  // Upload to Cloudinary
  const { url, publicId } = await uploadToCloudinary(
    req.file.buffer,
    req.file.mimetype,
    "eduai/submissions"
  );

  const fileType = mimeToFileType(req.file.mimetype);

  const submission = await createSubmission(req.user._id, {
    assignmentId,
    fileUrl: url,
    filePublicId: publicId,
    fileType,
  });

  // Respond immediately, then fire-and-forget grading
  res
    .status(201)
    .json(new ApiResponse(201, submission, "Submission received — grading will begin shortly"));

  // Trigger AI grading asynchronously
  import("../ai-grading/grading.service.js")
    .then(({ gradeSubmission }) => {
      gradeSubmission(submission._id).catch((err) =>
        console.error("Grading failed:", err.message)
      );
    })
    .catch((err) => console.error("Grading import failed:", err.message));
});

// ── GET /assignment/:assignmentId — teacher view ────────────────
const byAssignment = asyncHandler(async (req, res) => {
  const submissions = await getSubmissionsByAssignment(
    req.params.assignmentId,
    req.user._id
  );
  res.status(200).json(new ApiResponse(200, submissions));
});

// ── GET /my/:assignmentId — student view ────────────────────────
const mySubmission = asyncHandler(async (req, res) => {
  const submission = await getMySubmission(
    req.params.assignmentId,
    req.user._id
  );
  res.status(200).json(new ApiResponse(200, submission));
});

// ── GET /student/all — all my submissions ───────────────────────
const allMine = asyncHandler(async (req, res) => {
  const submissions = await getAllStudentSubmissions(req.user._id);
  res.status(200).json(new ApiResponse(200, submissions));
});

// ── GET /:id — single submission ────────────────────────────────
const getById = asyncHandler(async (req, res) => {
  const submission = await getSubmissionById(
    req.params.id,
    req.user._id,
    req.user.role
  );
  res.status(200).json(new ApiResponse(200, submission));
});

export { submit, byAssignment, mySubmission, allMine, getById };
