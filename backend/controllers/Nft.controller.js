import Application from "../models/Application.model.js";

export const recordMint = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    if (application.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Application is not approved.",
      });
    }

    if (application.paymentStatus !== "PAID") {
      return res.status(400).json({
        success: false,
        message: "Payment has not been verified.",
      });
    }

    if (application.nft?.mintTransactionId) {
      return res.status(400).json({
        success: false,
        message: "NFT has already been recorded.",
      });
    }

    const {
      mintTransactionId,
      tokenCategory,
      commitment,
      serial,
    } = req.body;

    if (
      !mintTransactionId ||
      !tokenCategory ||
      !commitment ||
      serial === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing NFT information.",
      });
    }

    application.status = "MINTED";

    application.nft = {
      mintTransactionId,
      tokenCategory,
      commitment,
      serial,
      mintedAt: new Date(),
    };

    await application.save();

    return res.status(200).json({
      success: true,
      message: "NFT recorded successfully.",
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNFTByApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    if (!application.nft) {
      return res.status(404).json({
        success: false,
        message: "NFT has not been minted yet.",
      });
    }

    return res.status(200).json({
      success: true,
      data: application.nft,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};