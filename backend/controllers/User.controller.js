import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import { generateTokenAndSetCookie } from "../middleware/generateTokenAndSetCookie.js";
import env from "dotenv";

env.config();

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "username, email, and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existing) {
      if (existing.email === email.toLowerCase()) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }
      return res.status(409).json({ success: false, message: "Username already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();

    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: isAdmin ? "ADMIN" : "USER",
    });

    await newUser.save();
    generateTokenAndSetCookie(res, newUser._id);

    const userObj = newUser.toObject();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: userObj,
    });
  } catch (err) {
    if (err?.code === 11000) {
      const dupKey = Object.keys(err.keyPattern || {}).join(", ");
      return res.status(409).json({ success: false, message: `Duplicate key: ${dupKey}` });
    }
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    generateTokenAndSetCookie(res, user._id);
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: userObj,
    });
  } catch (error) {
    console.error("Error in logging in:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully." });
};

export const getCurrentUser = async (req, res) => {
  try {
    const userObj = req.user.toObject();
    delete userObj.__v;
    res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId }).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};