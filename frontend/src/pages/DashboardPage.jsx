import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationForm from "../components/ApplicationForm";

export default function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const formRef = useRef(null);

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

  function openApplicationForm() {
    setShowApplicationForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
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
            type="button"
            onClick={() => navigate("/applications")}
            >
            My Applications
            </button>
        )}

        <button
            className="quiet nav-auth"
            type="button"
            onClick={signOut}
        >
            Sign Out
        </button>

        </div>
      </nav>

      <header id="top" className="hero">
        <div>
          <p className="eyebrow">
            CREDENTIALS ON BITCOIN CASH
          </p>

          <h1>
            Access credentials that <em>stay yours.</em>
          </h1>

          <p className="lede">
            Manage secure, non-transferable digital licenses
            backed by Bitcoin Cash and CashScript smart
            contracts.
          </p>

          <div className="hero-actions">
            {user?.role === "USER" && (
              <button
                className="primary"
                onClick={openApplicationForm}
              >
                Apply for License <span>→</span>
              </button>
            )}
          </div>
        </div>

        <div className="hero-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />

          <div className="nft-core">
            ⌁
            <small>
              SOULBOUND
              <br />
              ON BCH
            </small>
          </div>

          <span className="float-chip chip-a">
            NFT
          </span>

          <span className="float-chip chip-b">
            ✓ VALID
          </span>
        </div>
      </header>

      {showApplicationForm && (
        <section
          ref={formRef}
          className="application-form-section"
        >
          <ApplicationForm />
        </section>
      )}
    </main>
  );
}