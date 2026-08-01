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


  // Application workflow
  status: {
    type: String,
    enum: [
      "PENDING",     // waiting for admin review
      "APPROVED",    // approved, user can pay
      "REJECTED",    // rejected by admin
      "MINTED"       // NFT successfully created
    ],
    default: "PENDING",
  },


  // Payment information
  paymentStatus: {
    type: String,
    enum: [
      "UNPAID",     // waiting for payment
      "PAID"        // payment verified
    ],
    default: "UNPAID",
  },


  payment: {

    // BCH amount required
    amount: {
      type: Number,
      default: 0,
    },


    // BCH receiving address
    address: {
      type: String,
      default: "",
      trim: true,
    },


    // User submitted transaction hash
    transactionId: {
      type: String,
      default: "",
      trim: true,
    },


    // When blockchain verification succeeded
    verifiedAt: {
      type: Date,
    },

  },


  // NFT information after minting
  nft: {

    tokenId: {
      type: String,
      default: "",
    },


    transactionId: {
      type: String,
      default: "",
    },


    mintedAt: {
      type: Date,
    },

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


export default mongoose.model(
  "Application",
  applicationSchema
);