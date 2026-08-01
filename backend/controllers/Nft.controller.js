import Application from "../models/Application.model.js";
// import your CashScript mint function later
// import { mintNFT } from "../services/cashscript.service.js";


export const mintApplicationNFT = async (req, res) => {

try {

const application = await Application.findById(
  req.params.id
);


if (!application) {
  return res.status(404).json({
    success:false,
    message:"Application not found."
  });
}


// Payment check
if (application.paymentStatus !== "PAID") {

  return res.status(400).json({
    success:false,
    message:"Payment has not been verified."
  });

}


// Prevent duplicate minting
if (application.status === "MINTED") {

  return res.status(400).json({
    success:false,
    message:"NFT already minted."
  });

}


// --------------------------
// NFT METADATA
// --------------------------

const metadata = {

  name:
    `${application.licenseType} License`,

  description:
    "ProofPass blockchain license",

  applicant:
    application.fullName,

  licenseType:
    application.licenseType,

  applicationId:
    application._id,

  issuedAt:
    new Date(),

};



// --------------------------
// CASHCRIPT MINT HERE
// --------------------------


// const mintResult = await mintNFT(metadata);


// temporary hackathon response
const mintResult = {

  tokenId:
    "NFT-" + Date.now(),

  transactionId:
    "BCH-MINT-TX",

};



// Save NFT data

application.status = "MINTED";


application.nft = {

  tokenId:
    mintResult.tokenId,

  transactionId:
    mintResult.transactionId,

  mintedAt:
    new Date(),

};


await application.save();



res.status(200).json({

success:true,

message:"NFT minted successfully.",

data:application,

});


}
catch(error){

res.status(500).json({
success:false,
message:error.message,
});

}

};