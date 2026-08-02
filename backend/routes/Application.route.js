import express from "express";

import {
  createApplication,
  getAllApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  updatePaymentStatus,
  deleteApplication,
} from "../controllers/Application.controller.js";

import {
  recordMint,
  getNFTByApplication,
} from "../controllers/Nft.controller.js";

const router = express.Router();

// Create
router.post("/:applicant", createApplication);

// Read
router.get("/", getAllApplications);
router.get("/:id", getApplicationById);
router.get("/:id/nft", getNFTByApplication);

// Application workflow
router.put("/:id/approve", approveApplication);
router.put("/:id/reject", rejectApplication);
router.put("/:id/payment", updatePaymentStatus);
router.put("/:id/minted", recordMint);

// Delete
router.delete("/:id", deleteApplication);

export default router;