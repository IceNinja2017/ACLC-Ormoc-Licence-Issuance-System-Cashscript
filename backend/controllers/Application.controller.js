import Application from "../models/Application.model.js";

export const createApplication = async (req, res) => {
  try {
    const { applicant } = req.params;
    const { licenseType } = req.body;

    // Check if applicant already has a pending application
    const existingApplication = await Application.findOne({
      applicant,
      status: "PENDING",
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending application.",
      });
    }

    const application = await Application.create({
      applicant,
      licenseType,
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc Get all applications
 * @route GET /api/applications
 */
export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("applicant", "name email walletAddress");

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc Get application by ID
 * @route GET /api/applications/:id
 */
export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("applicant", "name email walletAddress");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc Approve an application
 * @route PUT /api/applications/:id/approve
 */
export const approveApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    application.status = "APPROVED";
    application.remarks = req.body.remarks || "";

    await application.save();

    res.status(200).json({
      success: true,
      message: "Application approved.",
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc Reject an application
 * @route PUT /api/applications/:id/reject
 */
export const rejectApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    application.status = "REJECTED";
    application.remarks = req.body.remarks || "";

    await application.save();

    res.status(200).json({
      success: true,
      message: "Application rejected.",
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc Delete an application
 * @route DELETE /api/applications/:id
 */
export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    await application.deleteOne();

    res.status(200).json({
      success: true,
      message: "Application deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};