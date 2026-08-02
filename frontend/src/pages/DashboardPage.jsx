import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserDashboard from "../components/UserDashboard";
import AdminDashboard from "../components/AdminDashboard";

export default function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  function signOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/", { replace: true });
  }

  return (
    <main>
      <nav>
        <a className="brand" href="#top">
          <span>⌁</span>
          ProofPass
        </a>

        <div className="nav-actions">
          {user?.role === "USER" && (
            <button
              className="quiet nav-auth"
              onClick={() => navigate("/applications")}
            >
              My Applications
            </button>
          )}

          {user?.role === "ADMIN" && (
            <button
              className="quiet nav-auth"
              onClick={() =>
                navigate("/admin/applications")
              }
            >
              Manage Applications
            </button>
          )}

          <button
            className="quiet nav-auth"
            onClick={signOut}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {user?.role === "ADMIN" ? (
        <AdminDashboard />
      ) : (
        <UserDashboard />
      )}
    </main>
  );
}