import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    license: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "License",
      required: true,
    },

    action: {
      type: String,
      enum: ["ISSUED", "RENEWED", "REVOKED", "VERIFIED"],
      required: true,
    },

    transactionHash: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ActivityLog", activityLogSchema);