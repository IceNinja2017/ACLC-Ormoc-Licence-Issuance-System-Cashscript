import express from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import mongoose, { get } from "mongoose";
import authRoutes from "./routes/route.js"
import cors from "cors";

const app = express();
const PORT = process.env.AuthenticationService_PORT || 5000;

app.listen(PORT, () =>{
    connectDB(mongoose);
    console.log("Server started at http://localhost:" + PORT);
});

//app.set("trust proxy", 1);

app.use(cors({
    origin: process.env.FRONTEND_BASE_URL,
    credentials: true,
}));

app.use(express.json()); // parse incoming JSON request
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // parse cookies
app.use("/api/auth", authRoutes);