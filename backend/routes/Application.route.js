import express from "express";
import {
  createApplication,
  getAllApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  deleteApplication,
} from "../controllers/Application.controller.js";
import { mintApplicationNFT } from "../controllers/Nft.controller.js";

const router = express.Router();

// Create a new application
router.post("/:applicant", createApplication);

// Get all applications
router.get("/", getAllApplications);

// Get a specific application
router.get("/:id", getApplicationById);

// Approve an application
router.put("/:id/approve", approveApplication);

// Reject an application
router.put("/:id/reject", rejectApplication);

// Delete an application
router.delete("/:id", deleteApplication);

router.post(
 "/:id/mint",
 mintApplicationNFT
);

export default router;