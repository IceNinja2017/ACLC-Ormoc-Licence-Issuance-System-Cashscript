import mongoose from "mongoose";

const licenseSchema = new mongoose.Schema(
  {
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    issuer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    licenseType: {
      type: String,
      enum: ["DRIVER", "PRC", "CSC"],
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "EXPIRED", "REVOKED"],
      default: "PENDING",
    },

    issueDate: {
      type: Date,
    },

    expiryDate: {
      type: Date,
    },

    nftTokenId: {
      type: String,
      default: "",
    },

    blockchainTxId: {
      type: String,
      default: "",
    },

    metadataURI: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("License", licenseSchema);