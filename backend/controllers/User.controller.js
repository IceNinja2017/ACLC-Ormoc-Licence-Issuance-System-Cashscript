import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.model.js";
import { generateTokenAndSetCookie } from "../middleware/generateTokenAndSetCookie.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import env from "dotenv";
import {convertToTokenAddress} from "../middleware/convertToTokenAddress.js";

env.config();

export const register = async (req, res) => {
    try {
        const { username, email, password, walletAddress, role } = req.body;

        // required field checks
        if (!username || !email || !password || walletAddress === undefined) {
            return res.status(400).json({ message: "username, email, password, walletAddress are required" });
        }

        // Check duplicates
        const existing = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }]
        });
        if (existing) {
            if (existing.email === email.toLowerCase()) {
                return res.status(409).json({ message: "Email already in use" });
            }
            return res.status(409).json({ message: "Username already in use" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        
        //Get TokenAddress from walletAddress
        const converted = await convertToTokenAddress(walletAddress);
        const tokenAddress = typeof converted === 'object' ? converted.address : converted;

        // Only create and save user after email succeeds
        const newUser = new User({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            walletAddress,
            tokenAddress,
        });

        await newUser.save();

        // JWT token
        generateTokenAndSetCookie(res, newUser._id);

        // Sanitize response
        const userObj = newUser.toObject();
        delete userObj.password;


        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            user: userObj
        });

    } catch (err) {
        if (err?.code === 11000) {
            const dupKey = Object.keys(err.keyPattern || {}).join(", ");
            return res.status(409).json({ message: `Duplicate key: ${dupKey}` });
        }
        console.error("Register error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    try {
        // Lowercase email check for case-insensitive logins
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials"
            });
        }

        generateTokenAndSetCookie(res, user._id);

        user.lastLogin = new Date();
        await user.save();

        // Standardized sanitization
        const userObj = user.toObject();
        delete userObj.password;

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: userObj
        });

    } catch (error) {
        console.error("Error in logging in:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
            success: true,
            message: "Logged out sucessfully"
        });
};

export const getUserById = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findOne({ _id: userId });

        if(!user) {
            return res.status(400).json({
                success: false,
                message: "User Not Found",
            });
        }

        res.status(200).json({
            success: true,
            message: "User Found!",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: true,
            message: error.message,
        });
    }
}