import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  createAssignment,
  getAssignmentsByClassroom,
  getAssignmentById,
  updateAssignment,
  publishAssignment,
  deleteAssignment,
} from "./assignment.service.js";

const create = asyncHandler(async (req, res) => {
  const assignment = await createAssignment(req.user._id, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, assignment, "Assignment created"));
});

const getByClassroom = asyncHandler(async (req, res) => {
  const assignments = await getAssignmentsByClassroom(
    req.params.classroomId,
    req.user._id,
    req.user.role
  );
  res.status(200).json(new ApiResponse(200, assignments));
});

const getById = asyncHandler(async (req, res) => {
  const assignment = await getAssignmentById(
    req.params.id,
    req.user._id,
    req.user.role
  );
  res.status(200).json(new ApiResponse(200, assignment));
});

const update = asyncHandler(async (req, res) => {
  const assignment = await updateAssignment(
    req.params.id,
    req.user._id,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, assignment, "Assignment updated"));
});

const publish = asyncHandler(async (req, res) => {
  const { assignment, studentIds } = await publishAssignment(
    req.params.id,
    req.user._id
  );

  // Send notifications asynchronously (import dynamically to avoid circular deps)
  import("../notifications/notification.controller.js")
    .then(({ createAndSend }) => {
      studentIds.forEach((studentId) => {
        createAndSend(
          studentId,
          "new_assignment",
          `New assignment: ${assignment.title}`,
          `/assignments/${assignment._id}`
        ).catch((err) =>
          console.error("Failed to notify student:", err.message)
        );
      });
    })
    .catch((err) => console.error("Notification import failed:", err.message));

  res
    .status(200)
    .json(new ApiResponse(200, assignment, "Assignment published"));
});

const remove = asyncHandler(async (req, res) => {
  await deleteAssignment(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, null, "Assignment deleted"));
});

export { create, getByClassroom, getById, update, publish, remove };
