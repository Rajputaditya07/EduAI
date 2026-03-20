import Classroom from "./classroom.model.js";
import User from "../users/user.model.js";
import { ApiError } from "../../utils/ApiError.js";

// ── Create ──────────────────────────────────────────────────────
const createClassroom = async (teacherId, { name, subject }) => {
  const classroom = await Classroom.create({
    name,
    subject,
    teacher: teacherId,
  });

  // Add classroom to teacher's classrooms array
  await User.findByIdAndUpdate(teacherId, {
    $push: { classrooms: classroom._id },
  });

  return classroom;
};

// ── Get teacher's classrooms ────────────────────────────────────
const getTeacherClassrooms = async (teacherId) => {
  return Classroom.find({ teacher: teacherId }).lean();
};

// ── Join by code (student) ──────────────────────────────────────
const joinClassroom = async (studentId, joinCode) => {
  const classroom = await Classroom.findOne({ joinCode, isActive: true });

  if (!classroom) {
    throw new ApiError(404, "Classroom not found or inactive");
  }

  if (classroom.students.some((s) => s.toString() === studentId.toString())) {
    throw new ApiError(409, "You are already enrolled in this classroom");
  }

  // Push student into classroom and classroom into student — in parallel
  await Promise.all([
    Classroom.findByIdAndUpdate(classroom._id, {
      $push: { students: studentId },
    }),
    User.findByIdAndUpdate(studentId, {
      $push: { classrooms: classroom._id },
    }),
  ]);

  return Classroom.findById(classroom._id)
    .populate("teacher", "name email")
    .lean();
};

// ── Get single classroom (access-checked) ───────────────────────
const getClassroomById = async (classroomId, requestingUserId, role) => {
  const classroom = await Classroom.findById(classroomId)
    .populate("teacher", "name email")
    .populate("students", "name email");

  if (!classroom) {
    throw new ApiError(404, "Classroom not found");
  }

  const isTeacher =
    classroom.teacher._id.toString() === requestingUserId.toString();
  const isEnrolledStudent = classroom.students.some(
    (s) => s._id.toString() === requestingUserId.toString()
  );

  if (role === "admin" || isTeacher || isEnrolledStudent) {
    return classroom;
  }

  throw new ApiError(403, "You do not have access to this classroom");
};

// ── Get students (teacher only) ─────────────────────────────────
const getClassroomStudents = async (classroomId, teacherId) => {
  const classroom = await Classroom.findById(classroomId).populate(
    "students",
    "name email"
  );

  if (!classroom) {
    throw new ApiError(404, "Classroom not found");
  }

  if (classroom.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, "Only the classroom teacher can view students");
  }

  return classroom.students;
};

// ── Archive ─────────────────────────────────────────────────────
const archiveClassroom = async (classroomId, teacherId) => {
  const classroom = await Classroom.findById(classroomId);

  if (!classroom) {
    throw new ApiError(404, "Classroom not found");
  }

  if (classroom.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, "Only the classroom teacher can archive");
  }

  classroom.isActive = false;
  await classroom.save();
  return classroom;
};

export {
  createClassroom,
  getTeacherClassrooms,
  joinClassroom,
  getClassroomById,
  getClassroomStudents,
  archiveClassroom,
};
