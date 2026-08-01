import express from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getUserProfile
} from "../controllers/User.controller.js"; 

import {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
  getActivityLogsByUser,
  getActivityLogsByLicense,
  deleteActivityLog,
} from "../controllers/ActivityLog.controller.js";

const router = express.Router();

// Define routes for user authentication and profile management
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/profile", getUserProfile);

// Define the routes for Application

// Define the routes for License

// Define the routes for Activity Logs
router.post("/", createActivityLog);

router.get("/", getActivityLogs);
router.get("/:id", getActivityLogById);
router.get("/user/:userId", getActivityLogsByUser);
router.get("/license/:licenseId", getActivityLogsByLicense);

router.delete("/:id", deleteActivityLog);

export default router;