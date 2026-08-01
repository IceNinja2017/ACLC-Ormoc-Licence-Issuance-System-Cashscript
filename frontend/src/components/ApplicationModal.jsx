import { useNavigate } from "react-router-dom";

export default function ApplicationModal({
  application,
  onClose,
}) {
  const navigate = useNavigate();

  if (!application) return null;
    function getStatusStyle(status) {
  switch (status) {
    case "APPROVED":
      return "bg-green-400/20 text-green-300";

    case "PENDING":
      return "bg-blue-400/20 text-blue-300";

    case "REJECTED":
      return "bg-red-400/20 text-red-300";

    case "PAID":
      return "bg-purple-400/20 text-purple-300";

    case "MINTED":
      return "bg-emerald-400/20 text-emerald-300";

    default:
      return "bg-gray-400/20 text-gray-300";
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
        bg-black/60
        backdrop-blur-sm
        p-4
      "
      onClick={onClose}
    >

      <div
        className="
          w-full
          max-w-2xl
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
                text-2xl
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
              px-3
              py-2
              text-slate-400
              hover:bg-white/10
              hover:text-white
            "
          >
            ✕
          </button>

        </div>



        {/* Status */}

        <div
          className="
            flex
            items-center
            justify-between
            bg-white/5
            px-8
            py-4
          "
        >

          <div>
            <p className="text-xs text-slate-400">
              License Type
            </p>

            <p className="font-semibold text-white">
              {application.licenseType}
            </p>
          </div>


<span
  className={`
    rounded-full
    px-4
    py-1.5
    text-sm
    font-semibold
    ${getStatusStyle(application.status)}
  `}
>
  {application.status}
</span>

        </div>



        {/* Information */}

        <div
          className="
            grid
            grid-cols-1
            gap-5
            px-8
            py-6
            sm:grid-cols-2
          "
        >

          <Info
            label="Application Type"
            value={
              application.applicationType || "NEW"
            }
          />


          <Info
            label="Birth Date"
            value={
              new Date(
                application.birthDate
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
            label="Contact Number"
            value={application.contactNumber}
          />


          <Info
            label="Address"
            value={application.address}
          />


          <Info
            label="Submitted"
            value={
              new Date(
                application.createdAt
              ).toLocaleDateString()
            }
          />


        </div>



        {/* Details */}

        <div
          className="
            mx-8
            mb-8
            rounded-xl
            bg-white/5
            p-5
          "
        >

          <p
            className="
              mb-3
              text-xs
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            Additional Information
          </p>


          <div className="space-y-2">

            {Object.entries(
              application.details || {}
            ).map(([key, value]) => (

              <div
                key={key}
                className="
                  flex
                  justify-between
                  border-b
                  border-white/10
                  py-2
                  text-sm
                "
              >

                <span className="text-slate-400">
                  {key}
                </span>


                <span className="text-white">
                  {value}
                </span>

              </div>

            ))}

          </div>

        </div>

{/* Payment */}

{application.status === "APPROVED" && (
  <div
    className="
      border-b
      border-white/10
      px-8
      py-5
    "
  >
    <div
      className="
        flex
        items-center
        justify-between
        rounded-xl
        bg-green-500/10
        p-4
      "
    >

      <div>
        <p className="font-semibold text-white">
          Payment Required
        </p>

        <p className="text-sm text-slate-400">
          Your application has been approved.
        </p>
      </div>


<button
  className="
    rounded-lg
    bg-green-500
    px-5
    py-2
    font-semibold
    text-black
    transition
    hover:bg-green-400
  "
  onClick={() => {
    navigate(`/payment/${application._id}`);
  }}
>
  Pay Now
</button>

    </div>
  </div>
)}

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
          tracking-wide
          text-slate-400
        "
      >
        {label}
      </p>


      <p
        className="
          mt-1
          text-white
        "
      >
        {value}
      </p>

    </div>
  );

}