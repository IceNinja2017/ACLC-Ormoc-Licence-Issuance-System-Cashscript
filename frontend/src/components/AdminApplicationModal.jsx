import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ApplicationModal({
  application,
  onClose,
}) {
  const navigate = useNavigate();

  if (!application) return null;

  function getStatusStyle(status) {
    switch (status) {
      case "APPROVED":
        return "bg-green-500/20 text-green-300";

      case "PENDING":
        return "bg-blue-500/20 text-blue-300";

      case "REJECTED":
        return "bg-red-500/20 text-red-300";

      case "MINTED":
        return "bg-purple-500/20 text-purple-300";

      default:
        return "bg-slate-500/20 text-slate-300";
    }
  }
  async function approveApplication(id) {
  try {
    const remarks = "Your application has been approved. Please proceed with the payment.";
    await axios.put(`/api/application/${id}/approve`, {
      remarks,
    });

    alert("Application approved.");

    // Refresh your table
    window.location.reload();

  } catch (err) {
    console.error(err);
    alert("Failed to approve application.");
  }
}

async function rejectApplication(id) {
  try {
    const remarks = "Your application has been rejected.";
    await axios.put(`/api/application/${id}/reject`, {
      remarks,
    });

    alert("Application rejected.");

    window.location.reload();

  } catch (err) {
    console.error(err);
    alert("Failed to reject application.");
  }
}

async function verifyPayment(id, transactionId) {
  try {
    await axios.put(`/api/application/${id}/payment`, {
      transactionId,
    });

    alert("Payment verified.");

    window.location.reload();

  } catch (err) {
    console.error(err);
    alert("Payment verification failed.");
  }
}

async function recordMint(id, mintData) {
  try {
    await axios.put(`/api/application/${id}/minted`, mintData);

    alert("NFT recorded.");

    window.location.reload();

  } catch (err) {
    console.error(err);
    alert("Failed to record NFT.");
  }
}

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/70
        backdrop-blur-sm
        p-4
      "
      onClick={onClose}
    >
      <div
        className="
          flex
          w-full
          max-w-3xl
          max-h-[90vh]
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-white/10
          bg-slate-950
          shadow-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-white/10
            px-8
            py-6
            shrink-0
          "
        >
          <div>

            <p
              className="
                text-xs
                uppercase
                tracking-[0.2em]
                text-slate-400
              "
            >
              License Application
            </p>

            <h2
              className="
                mt-1
                text-3xl
                font-bold
                text-white
              "
            >
              {application.fullName}
            </h2>

          </div>

          <button
            onClick={onClose}
            className="
              rounded-lg
              p-2
              text-slate-400
              transition
              hover:bg-white/10
              hover:text-white
            "
          >
            ✕
          </button>

        </div>

        {/* Scrollable Body */}

        <div
          className="
            flex-1
            overflow-y-auto
            px-8
            py-6
            space-y-8
          "
        >
                  {/* Status Banner */}

          <div
            className="
              flex
              flex-col
              gap-4
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-6
              md:flex-row
              md:items-center
              md:justify-between
            "
          >
            <div>

              <p className="text-xs uppercase tracking-widest text-slate-400">
                Current Status
              </p>

              <span
                className={`
                  mt-3
                  inline-flex
                  rounded-full
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  ${getStatusStyle(application.status)}
                `}
              >
                {application.status}
              </span>

            </div>

            <div className="text-right">

              <p className="text-xs uppercase tracking-widest text-slate-400">
                License Type
              </p>

              <h3 className="mt-2 text-xl font-bold text-white">
                {application.licenseType}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                {application.applicationType || "NEW"} Application
              </p>

            </div>

          </div>

          {/* Personal Information */}

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-6
            "
          >

            <h3 className="text-lg font-semibold text-white">
              Personal Information
            </h3>

            <div
              className="
                mt-6
                grid
                gap-6
                md:grid-cols-2
              "
            >

              <Info
                label="Full Name"
                value={application.fullName}
              />

              <Info
                label="Birth Date"
                value={
                  new Date(application.birthDate)
                    .toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )
                }
              />

              <Info
                label="Contact Number"
                value={application.contactNumber}
              />

              <Info
                label="Address"
                value={application.address}
              />

            </div>

          </div>

          {/* Application Information */}

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-6
            "
          >

            <h3 className="text-lg font-semibold text-white">
              Application Information
            </h3>

            <div
              className="
                mt-6
                grid
                gap-6
                md:grid-cols-2
              "
            >

              <Info
                label="Application Type"
                value={
                  application.applicationType || "NEW"
                }
              />

              <Info
                label="License Type"
                value={application.licenseType}
              />

              <Info
                label="Submitted"
                value={
                  new Date(
                    application.createdAt
                  ).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )
                }
              />

              <Info
                label="Payment Status"
                value={
                  application.paymentStatus ||
                  "UNPAID"
                }
              />

            </div>

          </div>
                    {/* Additional Information */}

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-6
            "
          >

            <h3 className="text-lg font-semibold text-white">
              Additional Information
            </h3>

            <div className="mt-6 overflow-hidden rounded-xl border border-white/10">

              {Object.keys(application.details || {}).length === 0 ? (

                <div className="p-5 text-slate-400">
                  No additional information provided.
                </div>

              ) : (

                Object.entries(application.details).map(([key, value]) => (

                  <div
                    key={key}
                    className="
                      flex
                      items-center
                      justify-between
                      border-b
                      border-white/10
                      px-5
                      py-4
                      last:border-b-0
                    "
                  >

                    <span className="capitalize text-slate-400">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>

                    <span className="font-medium text-white">
                      {value}
                    </span>

                  </div>

                ))

              )}

            </div>

          </div>

          {/* Remarks */}

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-6
            "
          >

            <h3 className="text-lg font-semibold text-white">
              Administrator Remarks
            </h3>

            <div
              className="
                mt-5
                rounded-xl
                border
                border-white/10
                bg-slate-900/60
                p-5
              "
            >

              <p className="leading-7 text-slate-300">
                {application.remarks ||
                  "No remarks have been added."}
              </p>

            </div>

          </div>

          {/* NFT Information */}

          {application.nft && (

            <div
              className="
                rounded-2xl
                border
                border-emerald-500/30
                bg-emerald-500/10
                p-6
              "
            >

              <h3 className="text-lg font-semibold text-emerald-300">
                NFT License
              </h3>

              <div
                className="
                  mt-6
                  grid
                  gap-6
                  md:grid-cols-2
                "
              >

                <Info
                  label="Token ID"
                  value={application.nft.tokenId}
                />

                <Info
                  label="Minted On"
                  value={
                    application.nft.mintedAt
                      ? new Date(
                          application.nft.mintedAt
                        ).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : "-"
                  }
                />

                <div className="md:col-span-2">

                  <Info
                    label="Mint Transaction"
                    value={
                      application.nft.transactionId
                    }
                  />

                </div>

              </div>

            </div>

          )}
                  </div>

        {/* Footer */}

        <div
          className="
            shrink-0
            border-t
            border-white/10
            bg-slate-950
            px-8
            py-5
          "
        >
          <div className="flex flex-wrap justify-end gap-3">

<div className="flex flex-wrap justify-end gap-3">

  <button
    onClick={onClose}
    className="rounded-lg border border-white/10 px-5 py-2.5 text-white"
  >
    Close
  </button>

  {/* Pending */}
  {application.status === "PENDING" && (
    <>
      <button
        onClick={() => rejectApplication(application._id)}
        className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-500"
      >
        Reject
      </button>

      <button
        onClick={() => approveApplication(application._id)}
        className="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-black hover:bg-green-400"
      >
        Approve
      </button>
    </>
  )}

  {/* Approved but payment not yet verified */}
  {application.status === "APPROVED" &&
    application.paymentStatus !== "PAID" && (
      <button
        onClick={() => {
          const txId = prompt("Enter BCH Transaction ID");

          if (txId) {
            verifyPayment(application._id, txId);
          }
        }}
        className="rounded-lg bg-cyan-500 px-5 py-2.5 font-semibold text-black hover:bg-cyan-400"
      >
        Verify Payment
      </button>
  )}

  {/* Payment verified but NFT not yet recorded */}
  {application.paymentStatus === "PAID" &&
    !application.nft && (
      <button
        onClick={() => {
          const tokenId = prompt("NFT Token ID");
          const transactionId = prompt("Mint Transaction ID");

          if (tokenId && transactionId) {
            recordMint(application._id, {
              tokenId,
              transactionId,
            });
          }
        }}
        className="rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-500"
      >
        Record NFT
      </button>
  )}

</div>

            {application.status === "APPROVED" &&
              application.paymentStatus !== "PAID" && (

              <button
                onClick={() =>
                  navigate(`/payment/${application._id}`)
                }
                className="
                  rounded-lg
                  bg-green-500
                  px-5
                  py-2.5
                  font-semibold
                  text-black
                  transition
                  hover:bg-green-400
                "
              >
                Pay Now
              </button>

            )}

            {application.paymentStatus === "PAID" &&
              !application.nft && (

              <button
                className="
                  rounded-lg
                  bg-purple-600
                  px-5
                  py-2.5
                  font-semibold
                  text-white
                  transition
                  hover:bg-purple-500
                "
                onClick={() => {
                  console.log("Mint NFT");
                }}
              >
                Mint NFT
              </button>

            )}

          </div>

        </div>

      </div>
    </div>
  );
}

function Info({ label, value }) {

  return (

    <div>

      <p
        className="
          text-xs
          uppercase
          tracking-wider
          text-slate-500
        "
      >
        {label}
      </p>

      <p
        className="
          mt-2
          break-words
          text-base
          font-medium
          text-white
        "
      >
        {value || "-"}
      </p>

    </div>

  );

}