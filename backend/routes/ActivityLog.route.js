import express from "express";
import {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
  getActivityLogsByUser,
  getActivityLogsByLicense,
  deleteActivityLog,
} from "../controllers/ActivityLog.controller.js";

const router = express.Router();

// Define the routes for Activity Logs
router.post("/", createActivityLog);

router.get("/", getActivityLogs);
router.get("/:id", getActivityLogById);
router.get("/user/:userId", getActivityLogsByUser);
router.get("/license/:licenseId", getActivityLogsByLicense);

router.delete("/:id", deleteActivityLog);

export default router;