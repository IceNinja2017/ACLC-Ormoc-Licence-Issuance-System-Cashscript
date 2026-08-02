import express from "express";
import {
  createApplication,
  getAllApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  updatePaymentStatus,
  getPaidApplicationsByUserId,
  deleteApplication,
} from "../controllers/Application.controller.js";
import { requireAuth, requireAdmin } from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/", requireAuth, createApplication);
router.get("/", requireAuth, requireAdmin, getAllApplications);
router.get("/paid/:userId", requireAuth, getPaidApplicationsByUserId);
router.get("/:id", requireAuth, getApplicationById);
router.put("/:id/approve", requireAuth, requireAdmin, approveApplication);
router.put("/:id/reject", requireAuth, requireAdmin, rejectApplication);
router.put("/:id/payment", requireAuth, updatePaymentStatus);
router.delete("/:id", requireAuth, requireAdmin, deleteApplication);

export default router;