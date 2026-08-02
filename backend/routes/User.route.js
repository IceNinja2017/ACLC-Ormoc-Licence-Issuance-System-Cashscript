import express from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
  getUserById,
} from "../controllers/User.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", requireAuth, getCurrentUser);
router.get("/profile/:userId", requireAuth, getUserById);

export default router;