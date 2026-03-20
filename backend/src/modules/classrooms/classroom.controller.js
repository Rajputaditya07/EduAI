import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  createClassroom,
  getTeacherClassrooms,
  joinClassroom,
  getClassroomById,
  getClassroomStudents,
  archiveClassroom,
} from "./classroom.service.js";

const create = asyncHandler(async (req, res) => {
  const classroom = await createClassroom(req.user._id, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, classroom, "Classroom created successfully"));
});

const getMyClassrooms = asyncHandler(async (req, res) => {
  const classrooms = await getTeacherClassrooms(req.user._id);
  res.status(200).json(new ApiResponse(200, classrooms));
});

const join = asyncHandler(async (req, res) => {
  const classroom = await joinClassroom(req.user._id, req.body.joinCode);
  res
    .status(200)
    .json(new ApiResponse(200, classroom, "Joined classroom successfully"));
});

const getById = asyncHandler(async (req, res) => {
  const classroom = await getClassroomById(
    req.params.id,
    req.user._id,
    req.user.role
  );
  res.status(200).json(new ApiResponse(200, classroom));
});

const getStudents = asyncHandler(async (req, res) => {
  const students = await getClassroomStudents(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, students));
});

const archive = asyncHandler(async (req, res) => {
  const classroom = await archiveClassroom(req.params.id, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, classroom, "Classroom archived"));
});

export { create, getMyClassrooms, join, getById, getStudents, archive };
