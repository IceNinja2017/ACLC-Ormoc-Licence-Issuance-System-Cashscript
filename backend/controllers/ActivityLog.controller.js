import ActivityLog from "../models/ActivityLogs.model.js";

export const createActivityLog = async (req, res) => {
  try {
    const { user, license, action, transactionHash } = req.body;
    const activityLog = await ActivityLog.create({ user, license, action, transactionHash });
    res.status(201).json({ success: true, data: activityLog });
  } catch (error) {
    console.error("Create Activity Log Error:", error);
    res.status(500).json({ success: false, message: "Failed to create activity log." });
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().populate("user", "username email").populate("license").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error("Get Activity Logs Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch activity logs." });
  }
};

export const getActivityLogById = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id).populate("user", "username email").populate("license");
    if (!log) return res.status(404).json({ success: false, message: "Activity log not found." });
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    console.error("Get Activity Log Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch activity log." });
  }
};

export const getActivityLogsByUser = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ user: req.params.userId }).populate("license").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error("Get User Activity Logs Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user's activity logs." });
  }
};

export const getActivityLogsByLicense = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ license: req.params.licenseId }).populate("user", "username email").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error("Get License Activity Logs Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch license activity logs." });
  }
};

export const deleteActivityLog = async (req, res) => {
  try {
    const log = await ActivityLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: "Activity log not found." });
    res.status(200).json({ success: true, message: "Activity log deleted successfully." });
  } catch (error) {
    console.error("Delete Activity Log Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete activity log." });
  }
};