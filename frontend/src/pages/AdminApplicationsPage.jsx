import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminApplicationModal from "../components/AdminApplicationModal";

export default function AdminApplicationsPage() {

  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("ALL");

  const [selectedApplication, setSelectedApplication] =
    useState(null);



  // ------------------------------------
  // Authentication
  // ------------------------------------

  useEffect(() => {

    const token =
      localStorage.getItem("token");

    if (!token) {
      navigate("/", {
        replace: true,
      });

      return;
    }

    if (user?.role !== "ADMIN") {
      navigate("/dashboard", {
        replace: true,
      });

      return;
    }

  }, [navigate, user]);

function getApplicationStatus(app) {

  if (
    app.nft?.tokenId &&
    app.nft?.transactionId
  ) {
    return "MINTED";
  }

  if (
    app.paymentStatus === "PAID"
  ) {
    return "PAID";
  }

  return app.status;

}

  // ------------------------------------
  // Load Applications
  // ------------------------------------

  async function fetchApplications() {

    try {

      setLoading(true);

      const response =
        await axios.get(
          "/api/application/"
        );

      setApplications(
        response.data.data
      );

    }
    catch (err) {

      console.error(err);

      setError(
        "Failed to load applications."
      );

    }
    finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    fetchApplications();

  }, []);




  // ------------------------------------
  // Read URL Hash
  // ------------------------------------

  useEffect(() => {

    function updateFilter() {

      const hash =
        window.location.hash.replace(
          "#",
          ""
        );

      switch (hash) {

        case "pending":
          setFilter("PENDING");
          break;

        case "approved":
          setFilter("APPROVED");
          break;

        case "paid":
          setFilter("PAID");
          break;

        case "minted":
          setFilter("MINTED");
          break;

        default:
          setFilter("ALL");

      }

    }

    updateFilter();

    window.addEventListener(
      "hashchange",
      updateFilter
    );

    return () =>
      window.removeEventListener(
        "hashchange",
        updateFilter
      );

  }, []);




  // ------------------------------------
  // Sign Out
  // ------------------------------------

  function signOut() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/", {
      replace: true,
    });

  }




  // ------------------------------------
  // Filter Applications
  // ------------------------------------

  const filteredApplications =
    useMemo(() => {

      return applications.filter(
        (app) => {

          const matchesSearch =
            app.fullName
              .toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||

            app.licenseType
              .toLowerCase()
              .includes(
                search.toLowerCase()
              );

          if (!matchesSearch)
            return false;

          switch (filter) {

            case "PENDING":

              return (
                app.status ===
                "PENDING"
              );

            case "APPROVED":

              return (
                app.status ===
                  "APPROVED" &&
                app.paymentStatus ===
                  "UNPAID"
              );

case "PAID":

  return (
    app.paymentStatus === "PAID" &&
    !app.nft?.tokenId &&
    !app.nft?.transactionId
  );


case "MINTED":

  return (
    app.nft?.tokenId &&
    app.nft?.transactionId
  );

            default:

              return true;

          }

        }
      );

    }, [
      applications,
      filter,
      search,
    ]);



  return (

    <main>

      {/* NAVBAR */}

      <nav>

        <a
          href="#top"
          className="brand"
        >
          <span>⌁</span>

          ProofPass
        </a>


        <div className="nav-actions">

          <button
            className="quiet nav-auth"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Dashboard
          </button>


          <button
            className="quiet nav-auth"
            onClick={signOut}
          >
            Sign Out
          </button>

        </div>

      </nav>



      {/* HERO */}

      <header
        id="top"
        className="hero"
      >

        <div>

          <p className="eyebrow">
            ADMIN PANEL
          </p>

          <h1>
            Manage
            {" "}
            <em>
              Applications
            </em>
          </h1>

          <p className="lede">
            Review applications,
            verify payments,
            and mint
            blockchain-backed
            licenses.
          </p>

        </div>

      </header>



      {/* PANEL */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <p className="eyebrow">
              APPLICATIONS
            </p>

            <h2>
              Application
              Management
            </h2>

          </div>

        </div>



        {/* SEARCH */}

        <div className="mt-8">

          <input
            type="text"
            placeholder="Search applicant or license..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="
              w-full
              rounded-xl
              border
              border-white/10
              bg-white/5
              px-4
              py-3
              text-white
              outline-none
              focus:border-green-400
            "
          />

        </div>



        {/* FILTER TABS */}

        <div className="mt-6 flex flex-wrap gap-3">

          {[
            "ALL",
            "PENDING",
            "APPROVED",
            "PAID",
            "MINTED",
          ].map((item) => (

            <button
              key={item}
              onClick={() =>
                setFilter(item)
              }
              className={`
                rounded-lg
                px-4
                py-2
                text-sm
                transition
                ${
                  filter === item
                    ? "bg-green-500 text-black"
                    : "bg-white/5 text-white hover:bg-white/10"
                }
              `}
            >
              {item}
            </button>

          ))}

        </div>

        {/* TABLE */}

        {loading && (
          <div className="py-10 text-center text-slate-400">
            Loading applications...
          </div>
        )}

        {error && (
          <div className="py-10 text-center text-red-400">
            {error}
          </div>
        )}

        {!loading &&
          filteredApplications.length === 0 && (
            <div className="py-10 text-center text-slate-400">
              No applications found.
            </div>
          )}

        {!loading &&
          filteredApplications.length > 0 && (

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">

            <table className="min-w-full">

              <thead className="bg-white/5">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Type
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    License
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Applicant
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Payment
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredApplications.map((app) => (

                  <tr
                    key={app._id}
                    className="border-t border-white/10 hover:bg-white/5 transition"
                  >

                    <td className="px-6 py-4 text-white">
                      {app.applicationType}
                    </td>

                    <td className="px-6 py-4 text-white">
                      {app.licenseType}
                    </td>

                    <td className="px-6 py-4">

                      <div className="font-medium text-white">
                        {app.fullName}
                      </div>

                      <div className="text-sm text-slate-400">
                        {app.applicant.email}
                      </div>

                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`
                          rounded-full
                          px-3
                          py-1
                          text-xs
                          font-semibold

                          ${
                            app.status === "PENDING"
                              ? "bg-blue-500/20 text-blue-300"

                            : app.status === "APPROVED"
                              ? "bg-green-500/20 text-green-300"

                            : app.status === "REJECTED"
                              ? "bg-red-500/20 text-red-300"

                            : getApplicationStatus(app) === "MINTED"
                              ? "bg-purple-500/20 text-purple-300"

                            :getApplicationStatus(app) === "PAID"
                            ? "bg-cyan-500/20 text-cyan-300"

                            : "bg-gray-500/20 text-gray-300"
                          }
                        `}
                      >
                        {getApplicationStatus(app)}
                      </span>

                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`
                          rounded-full
                          px-3
                          py-1
                          text-xs
                          font-semibold

                          ${
                            app.paymentStatus === "PAID"
                              ? "bg-emerald-500/20 text-emerald-300"

                              : "bg-yellow-500/20 text-yellow-300"
                          }
                        `}
                      >
                        {app.paymentStatus}
                      </span>

                    </td>

                    <td className="px-6 py-4 text-center">

                      <button
                        onClick={() =>
                          setSelectedApplication(app)
                        }
                        className="
                          rounded-lg
                          bg-green-500
                          px-4
                          py-2
                          text-sm
                          font-semibold
                          text-black
                          transition
                          hover:bg-green-400
                        "
                      >
                        View
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}



        {/* MODAL */}

        {selectedApplication && (

          <AdminApplicationModal

            application={selectedApplication}

            onClose={() =>
              setSelectedApplication(null)
            }

            refreshApplications={fetchApplications}

          />

        )}


      </section>

    </main>

  );

}