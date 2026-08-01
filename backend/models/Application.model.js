import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    licenseType: {
      type: String,
      enum: ["DRIVER", "PRC", "BUSINESS"],
      required: true,
    },

    // Common applicant information
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    birthDate: {
      type: Date,
      required: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // License-specific fields
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    paymentStatus: {
    type: String,
    enum: ["UNPAID", "PAID"],
    default: "UNPAID",
    },

    remarks: {
      type: String,
      default: "Pending Remarks",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Application", applicationSchema);