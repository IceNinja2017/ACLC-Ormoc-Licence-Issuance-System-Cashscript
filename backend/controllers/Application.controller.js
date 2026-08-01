import Application from "../models/Application.model.js";

export const createApplication = async (req, res) => {
  try {
    const { applicant } = req.params; // or req.user.id if using auth

    const {
      licenseType,
      fullName,
      birthDate,
      address,
      contactNumber,
      details,
      applicationType
    } = req.body;

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
      fullName,
      birthDate,
      address,
      contactNumber,
      details,
      applicationType,
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

export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("applicant", "name email walletAddress applicationType");

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

//add paid status update here, only update if the application is approved and payment is successful
export const updatePaymentStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    // Only update payment status if the application is approved
    if (application.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Payment status can only be updated for approved applications.",
      });
    }

    application.paymentStatus = req.body.paymentStatus;
    await application.save();

    res.status(200).json({
      success: true,
      message: "Payment status updated.",
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//add get paid applications by user id here
export const getPaidApplicationsByUserId = async (req, res) => {
  try {
    const applications = await Application.find({
      applicant: req.params.userId,
      paymentStatus: "PAID"
    }).populate("applicant", "name email walletAddress");

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