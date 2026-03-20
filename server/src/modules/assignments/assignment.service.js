import Assignment from "./assignment.model.js";
import Classroom from "../classrooms/classroom.model.js";
import Submission from "../submissions/submission.model.js";
import { ApiError } from "../../utils/ApiError.js";

// ── Create ──────────────────────────────────────────────────────
const createAssignment = async (teacherId, data) => {
  const classroom = await Classroom.findById(data.classroom);
  if (!classroom) throw new ApiError(404, "Classroom not found");
  if (classroom.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, "You are not the teacher of this classroom");
  }

  const assignment = await Assignment.create({ ...data, teacher: teacherId });
  return assignment;
};

// ── Get by classroom ────────────────────────────────────────────
const getAssignmentsByClassroom = async (classroomId, userId, role) => {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) throw new ApiError(404, "Classroom not found");

  if (role === "teacher") {
    if (classroom.teacher.toString() !== userId.toString()) {
      throw new ApiError(403, "You are not the teacher of this classroom");
    }
  } else {
    const isEnrolled = classroom.students.some(
      (s) => s.toString() === userId.toString()
    );
    if (!isEnrolled) {
      throw new ApiError(403, "You are not enrolled in this classroom");
    }
  }

  // Students only see published/closed; teachers see all
  const filter = { classroom: classroomId };
  if (role !== "teacher" && role !== "admin") {
    filter.status = { $in: ["published", "closed"] };
  }

  return Assignment.find(filter).sort({ createdAt: -1 }).lean();
};

// ── Get by ID ───────────────────────────────────────────────────
const getAssignmentById = async (assignmentId, userId, role) => {
  const assignment = await Assignment.findById(assignmentId)
    .populate("classroom", "name")
    .populate("teacher", "name email");

  if (!assignment) throw new ApiError(404, "Assignment not found");

  const classroom = await Classroom.findById(assignment.classroom._id || assignment.classroom);

  if (role === "teacher" || role === "admin") {
    if (
      role === "teacher" &&
      assignment.teacher._id.toString() !== userId.toString()
    ) {
      throw new ApiError(403, "You are not the teacher of this assignment");
    }
  } else {
    const isEnrolled = classroom.students.some(
      (s) => s.toString() === userId.toString()
    );
    if (!isEnrolled) {
      throw new ApiError(403, "You are not enrolled in this classroom");
    }
  }

  return assignment;
};

// ── Update ──────────────────────────────────────────────────────
const updateAssignment = async (assignmentId, teacherId, updates) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found");
  if (assignment.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, "You are not the teacher of this assignment");
  }

  // If rubric change attempted, check for existing submissions
  if (updates.rubric) {
    const submissionCount = await Submission.countDocuments({
      assignment: assignmentId,
    });
    if (submissionCount > 0) {
      throw new ApiError(
        400,
        "Cannot modify rubric after submissions exist. You may update title, description, or due date."
      );
    }
  }

  Object.assign(assignment, updates);
  await assignment.save();
  return assignment;
};

// ── Publish ─────────────────────────────────────────────────────
const publishAssignment = async (assignmentId, teacherId) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found");
  if (assignment.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, "You are not the teacher of this assignment");
  }
  if (assignment.status !== "draft") {
    throw new ApiError(400, "Only draft assignments can be published");
  }

  assignment.status = "published";
  await assignment.save();

  // Return classroom students so controller can send notifications
  const classroom = await Classroom.findById(assignment.classroom);
  return { assignment, studentIds: classroom.students };
};

// ── Delete ──────────────────────────────────────────────────────
const deleteAssignment = async (assignmentId, teacherId) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found");
  if (assignment.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, "You are not the teacher of this assignment");
  }
  if (assignment.status !== "draft") {
    throw new ApiError(400, "Only draft assignments can be deleted");
  }

  await Assignment.findByIdAndDelete(assignmentId);
  return { deleted: true };
};

export {
  createAssignment,
  getAssignmentsByClassroom,
  getAssignmentById,
  updateAssignment,
  publishAssignment,
  deleteAssignment,
};
