import express from "express";
import { 
    register, 
    login, 
    logout, 
    getUserById
} from "../controllers/User.controller.js"; 

const router = express.Router();

// Define routes for user authentication and profile management
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/profile/:userId", getUserById);

// Define the routes for Application

// Define the routes for License

export default router;