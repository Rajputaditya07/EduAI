import Submission from "./submission.model.js";
import Assignment from "../assignments/assignment.model.js";
import Classroom from "../classrooms/classroom.model.js";
import { ApiError } from "../../utils/ApiError.js";

// ── Create ──────────────────────────────────────────────────────
const createSubmission = async (
  studentId,
  { assignmentId, fileUrl, filePublicId, fileType }
) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found");
  if (assignment.status !== "published") {
    throw new ApiError(400, "Assignment is not open for submissions");
  }

  // Verify student is enrolled
  const classroom = await Classroom.findById(assignment.classroom);
  const isEnrolled = classroom.students.some(
    (s) => s.toString() === studentId.toString()
  );
  if (!isEnrolled) {
    throw new ApiError(
      403,
      "You are not enrolled in the assignment's classroom"
    );
  }

  // Check due date
  if (new Date() > new Date(assignment.dueDate)) {
    throw new ApiError(400, "The due date for this assignment has passed");
  }

  // Check duplicate
  const existing = await Submission.findOne({
    assignment: assignmentId,
    student: studentId,
  });
  if (existing) {
    throw new ApiError(409, "You have already submitted this assignment");
  }

  const submission = await Submission.create({
    assignment: assignmentId,
    student: studentId,
    classroom: classroom._id,
    fileUrl,
    filePublicId,
    fileType,
    status: "pending",
  });

  return submission;
};

// ── Get all submissions for an assignment (teacher) ─────────────
const getSubmissionsByAssignment = async (assignmentId, teacherId) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found");
  if (assignment.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, "You are not the teacher of this assignment");
  }

  return Submission.find({ assignment: assignmentId })
    .populate("student", "name email")
    .sort({ submittedAt: -1 })
    .lean();
};

// ── Get my submission (student) ─────────────────────────────────
const getMySubmission = async (assignmentId, studentId) => {
  const submission = await Submission.findOne({
    assignment: assignmentId,
    student: studentId,
  }).lean();

  if (!submission) throw new ApiError(404, "No submission found");
  return submission;
};

// ── Get by ID (access-checked) ──────────────────────────────────
const getSubmissionById = async (submissionId, userId, role) => {
  const submission = await Submission.findById(submissionId)
    .populate("student", "name email")
    .populate("assignment", "title rubric totalMarks")
    .populate("classroom", "name");

  if (!submission) throw new ApiError(404, "Submission not found");

  if (role === "admin") return submission;

  if (role === "teacher") {
    const assignment = await Assignment.findById(submission.assignment._id || submission.assignment);
    if (assignment.teacher.toString() !== userId.toString()) {
      throw new ApiError(403, "Access denied");
    }
  } else if (submission.student._id.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  return submission;
};

// ── Get all student submissions ─────────────────────────────────
const getAllStudentSubmissions = async (studentId) => {
  return Submission.find({ student: studentId })
    .populate("assignment", "title totalMarks")
    .populate("classroom", "name")
    .sort({ submittedAt: -1 })
    .lean();
};

export {
  createSubmission,
  getSubmissionsByAssignment,
  getMySubmission,
  getSubmissionById,
  getAllStudentSubmissions,
};
