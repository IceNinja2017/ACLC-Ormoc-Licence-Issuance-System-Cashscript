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
      enum: ["DRIVER", "PRC", "BUSINESS"],
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
      required: true,
    },

    blockchainTxId: {
      type: String,
      required: true,
    },

    metadataURI: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("License", licenseSchema);