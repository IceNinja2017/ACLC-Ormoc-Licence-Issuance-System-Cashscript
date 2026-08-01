import express from "express";
import { registerUser, loginUser, logoutUser, getUserProfile} from "../controllers/User.controller.js"; 
const router = express.Router();

// Define routes for user authentication and profile management
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/profile", getUserProfile);



export default router;