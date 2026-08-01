import express from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import mongoose, { get } from "mongoose";
import userRoutes from "./routes/User.route.js"
import activityRoutes from "./routes/ActivityLog.route.js"
import licenseRoutes from "./routes/License.route.js"
import applicationRoutes from "./routes/Application.route.js"
import cors from "cors";
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
const app = express();
const PORT = process.env.AuthenticationService_PORT || 5000;

//app.set("trust proxy", 1);

app.use(cors({
    origin: process.env.FRONTEND_BASE_URL,
    credentials: true,
}));

app.use(express.json()); // parse incoming JSON request
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // parse cookies

app.use("/api/user/", userRoutes)
app.use("/api/activity/", activityRoutes)
app.use("/api/license/", licenseRoutes)
app.use("/api/application/", applicationRoutes)

app.listen(PORT, () =>{
    connectDB(mongoose);
    console.log("Server started at http://localhost:" + PORT);
});