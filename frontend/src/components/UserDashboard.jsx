import { useRef, useState } from "react";
import ApplicationForm from "./ApplicationForm";

export default function UserDashboard() {
  const [showApplicationForm, setShowApplicationForm] =
    useState(false);

  const formRef = useRef(null);

  function openApplicationForm() {
    setShowApplicationForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  }

  return (
    <>
      <header id="top" className="hero">
        <div>
          <p className="eyebrow">
            CREDENTIALS ON BITCOIN CASH
          </p>

          <h1>
            Access credentials that <em>stay yours.</em>
          </h1>

          <p className="lede">
            Manage secure, non-transferable digital
            licenses backed by Bitcoin Cash and
            CashScript smart contracts.
          </p>

          <div className="hero-actions">
            <button
              className="primary"
              onClick={openApplicationForm}
            >
              Apply for License <span>→</span>
            </button>
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
    </>
  );
}