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

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },

    holderPaymentAddress: { type: String, default: "" },
    holderPkh: { type: String, default: "" },
    holderName: { type: String, default: "" },
    nameHash: { type: String, default: "" },

    issuer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    licenseType: {
      type: String,
      enum: ["DRIVER", "PRC", "BUSINESS"],
      required: true,
    },

    classId: { type: Number, default: 1 },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "EXPIRED", "REVOKED"],
      default: "PENDING",
    },

    issueDate: { type: Date },
    expiryBlock: { type: Number, default: 0 },
    expiryDate: { type: Date },

    // On-chain CashToken identity
    category: { type: String, default: "" },
    commitment: { type: String, default: "" },
    serial: { type: Number, default: 0 },
    vaultAddress: { type: String, default: "" },
    nftTokenId: { type: String, default: "" },
    blockchainTxId: { type: String, default: "" },
    metadataURI: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("License", licenseSchema);