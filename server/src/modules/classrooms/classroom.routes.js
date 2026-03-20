import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import {
  create,
  getMyClassrooms,
  join,
  getById,
  getStudents,
  archive,
} from "./classroom.controller.js";

const router = Router();

router.use(verifyJWT); // All routes require auth

router.post("/", authorizeRoles("teacher"), create);
router.get("/", authorizeRoles("teacher"), getMyClassrooms);
router.post("/join", authorizeRoles("student"), join);
router.get("/:id", getById);
router.get("/:id/students", authorizeRoles("teacher"), getStudents);
router.patch("/:id/archive", authorizeRoles("teacher"), archive);

export default router;
