import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { uploadMiddleware } from "../../middleware/upload.middleware.js";
import {
  submit,
  byAssignment,
  mySubmission,
  allMine,
  getById,
} from "./submission.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/", authorizeRoles("student"), uploadMiddleware, submit);
router.get(
  "/assignment/:assignmentId",
  authorizeRoles("teacher"),
  byAssignment
);
router.get("/my/:assignmentId", authorizeRoles("student"), mySubmission);
router.get("/student/all", authorizeRoles("student"), allMine);
router.get("/:id", getById);

export default router;
