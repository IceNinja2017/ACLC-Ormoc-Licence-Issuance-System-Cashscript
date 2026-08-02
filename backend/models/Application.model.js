import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    applicationType: {
      type: String,
      enum: ["NEW", "RENEWAL"],
      required: true,
    },

    licenseType: {
      type: String,
      enum: ["DRIVER", "PRC", "BUSINESS"],
      required: true,
    },

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

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "MINTED"],
      default: "PENDING",
    },

    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID"],
      default: "UNPAID",
    },

    payment: {
      amount: { type: Number, default: 0 },
      address: { type: String, default: "", trim: true },
      transactionId: { type: String, default: "", trim: true },
      verifiedAt: { type: Date },
      payerAddress: { type: String, default: "" },
    },

    nft: {
      tokenId: { type: String, default: "" },
      transactionId: { type: String, default: "" },
      mintedAt: { type: Date },
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