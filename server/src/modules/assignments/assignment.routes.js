import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import {
  create,
  getByClassroom,
  getById,
  update,
  publish,
  remove,
} from "./assignment.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/", authorizeRoles("teacher"), create);
router.get("/classroom/:classroomId", getByClassroom);
router.get("/:id", getById);
router.patch("/:id", authorizeRoles("teacher"), update);
router.patch("/:id/publish", authorizeRoles("teacher"), publish);
router.delete("/:id", authorizeRoles("teacher"), remove);

export default router;
