import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["ADMIN", "USER", "VERIFIER"],
      default: "USER",
    },

    walletAddress: {
      type: String,
      required: true,
    },
    tokenAddress: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);