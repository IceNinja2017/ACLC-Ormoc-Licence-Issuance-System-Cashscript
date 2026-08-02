import express from "express";
import {
  confirmMint,
  confirmRevoke,
  getLicense,
  listLicenses,
  mintLicense,
  renewLicense,
  revokeLicense,
  verifyLicense,
} from "../controllers/License.controller.js";
import { requireAdmin, requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// Public: anyone can verify or renew (renewal is permissionless by design)
router.get("/verify/:licenseNumber", verifyLicense);
router.post("/renew/:licenseNumber", renewLicense);

// Authenticated
router.get("/", requireAuth, listLicenses);
router.get("/:licenseNumber", requireAuth, getLicense);

// Admin-only
router.post("/mint/:applicationId", requireAuth, requireAdmin, mintLicense);
router.post("/mint/:licenseNumber/confirm", requireAuth, requireAdmin, confirmMint);
router.post("/revoke/:licenseNumber", requireAuth, requireAdmin, revokeLicense);
router.post("/revoke/:licenseNumber/confirm", requireAuth, requireAdmin, confirmRevoke);

export default router;