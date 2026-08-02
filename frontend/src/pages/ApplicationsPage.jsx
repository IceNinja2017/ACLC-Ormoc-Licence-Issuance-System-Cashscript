import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationModal from "../components/ApplicationModal";
import axios from "axios";
import { getCurrentUser, logoutUser } from "../lib/auth";

export default function Applications() {
    const navigate = useNavigate();

    const [selectedApplication, setSelectedApplication] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);


  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await getCurrentUser();
        if (cancelled) return;
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/application/`);
        const applicationsData = response.data.data;
        const userApplications = applicationsData.filter(
          (application) => application.applicant?._id === payload.user._id
        );
        if (!cancelled) setApplications(userApplications);
      } catch {
        if (!cancelled) navigate("/", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);


  async function signOut() {
    try { await logoutUser(); } catch { /* ignore */ }
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }

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
    <main>


      <nav>

        <a
          className="brand"
          href="#top"
        >
          <span>
            ⌁
          </span>

          ProofPass
        </a>


        <div className="nav-actions">

          <button
            className="quiet nav-auth"
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>


          <button
            className="quiet nav-auth"
            type="button"
            onClick={signOut}
          >
            Sign Out
          </button>

        </div>

      </nav>



      <section className="hero">

        <div>

          <p className="eyebrow">
            LICENSE HISTORY
          </p>


          <h1>
            My Applications
          </h1>


          <p className="lede">
            View your submitted license applications
            and track their current status.
          </p>


        </div>

      </section>



      <section className="panel application-panel">

        <div className="panel-heading">

          <div>
            <p className="eyebrow">
              APPLICATION RECORDS
            </p>

            <h2>
              Submitted Applications
            </h2>
          </div>


          <span
            className="icon-orb mint"
          >
            ⌁
          </span>

        </div>



        {loading && (
          <p>
            Loading applications...
          </p>
        )}



        {!loading && applications.length === 0 && (
          <p className="helper">
            You have not submitted any applications yet.
          </p>
        )}



    {!loading && applications.length > 0 && (

    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">

        <table className="w-full text-left">

        <thead className="bg-white/5 text-sm uppercase tracking-wider text-slate-400">

            <tr>

            <th className="px-6 py-4">
                Type
            </th>

            <th className="px-6 py-4">
                License
            </th>

            <th className="px-6 py-4">
                Name
            </th>

            <th className="px-6 py-4">
                Status
            </th>

            </tr>

        </thead>


        <tbody className="divide-y divide-white/10">

            {applications.map((app) => (

            <tr
                key={app._id}
                onClick={() => setSelectedApplication(app)}
                className="
                cursor-pointer
                transition
                hover:bg-white/5
                "
            >

                <td className="px-6 py-4 text-white">
                {app.applicationType || "NEW"}
                </td>


                <td className="px-6 py-4 text-white">
                {app.licenseType}
                </td>


                <td className="px-6 py-4 font-medium text-white">
                {app.fullName}
                </td>


                <td className="px-6 py-4">

                <span
                    className={`
                        rounded-full
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        ${getStatusStyle(app.status)}
                    `}
                >
                    {app.status}
                </span>

                </td>

            </tr>

            ))}

        </tbody>

        </table>

    </div>

    )}

        {selectedApplication && (
        <ApplicationModal
            application={selectedApplication}
            onClose={() => setSelectedApplication(null)}
        />
        )}

      </section>


    </main>
  );
}