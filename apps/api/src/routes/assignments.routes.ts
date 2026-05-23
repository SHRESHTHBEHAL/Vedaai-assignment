import { Router } from "express";
import { uploadSingle } from "../middleware/upload";
import {
  createAssignment,
  listAssignments,
  getAssignment,
  getAssignmentPaper,
  regenerateAssignment,
  deleteAssignment,
} from "../controllers/assignments.controller";

const router = Router();

router.post("/", uploadSingle, createAssignment);
router.get("/", listAssignments);
router.get("/:id", getAssignment);
router.get("/:id/paper", getAssignmentPaper);
router.post("/:id/regenerate", regenerateAssignment);
router.delete("/:id", deleteAssignment);

export { router as assignmentRoutes };
