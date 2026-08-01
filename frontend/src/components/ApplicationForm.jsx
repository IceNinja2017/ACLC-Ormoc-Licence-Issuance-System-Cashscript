import { useState } from "react";
import DriverForm from "./forms/DriverForm";
import PRCForm from "./forms/PRCForm";
import BusinessForm from "./forms/BusinessForm";
import axios from "axios";

export default function ApplicationForm() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    applicationType: "NEW",
    licenseType: "DRIVER",
    fullName: "",
    birthDate: "",
    address: "",
    contactNumber: "",
    details: {},
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function updateDetails(details) {
    setFormData((prev) => ({
      ...prev,
      details,
    }));
  }

async function submit(e) {
  e.preventDefault();

  setBusy(true);
  setError("");

  try {
    const response = await axios.post(
      `/api/application/${user._id}`,
      formData
    );

    console.log("Application created:", response.data);

    alert("Application submitted successfully!");

    // optional: reset form
    setFormData({
      applicationType: "NEW",
      licenseType: "DRIVER",
      fullName: "",
      birthDate: "",
      address: "",
      contactNumber: "",
      details: {},
    });

  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.message || 
      "Failed to submit application"
    );

  } finally {
    setBusy(false);
  }
}

  return (
    <section
      className="panel application-panel"
      aria-labelledby="application-heading"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            LICENSE APPLICATION
          </p>

          <h2 id="application-heading">
            Apply or Renew a License
          </h2>
        </div>

        <span
          className="icon-orb mint"
          aria-hidden="true"
        >
          ⌁
        </span>
      </div>

      <form
        className="auth-form application-form"
        onSubmit={submit}
      >
        <div className="full">
        <p className="application-label">
            Application Type
        </p>

        <div
            className="auth-tabs"
            role="tablist"
        >
            <button
            type="button"
            className={
                formData.applicationType === "NEW"
                ? "active"
                : ""
            }
            onClick={() =>
                setFormData((prev) => ({
                ...prev,
                applicationType: "NEW",
                }))
            }
            >
            New License
            </button>

            <button
            type="button"
            className={
                formData.applicationType === "RENEWAL"
                ? "active"
                : ""
            }
            onClick={() =>
                setFormData((prev) => ({
                ...prev,
                applicationType: "RENEWAL",
                }))
            }
            >
            Renew License
            </button>
        </div>
        </div>

        {/* License Type */}
        <div className="full">
        <p className="application-label">
            License Type
        </p>

        <div
            className="auth-tabs"
            role="tablist"
            aria-label="License type"
        >
            <button
            type="button"
            className={
                formData.licenseType === "DRIVER"
                ? "active"
                : ""
            }
            onClick={() =>
                setFormData((prev) => ({
                ...prev,
                licenseType: "DRIVER",
                details: {},
                }))
            }
            >
            🚗 Driver
            </button>

            <button
            type="button"
            className={
                formData.licenseType === "PRC"
                ? "active"
                : ""
            }
            onClick={() =>
                setFormData((prev) => ({
                ...prev,
                licenseType: "PRC",
                details: {},
                }))
            }
            >
            👨‍⚕️ PRC
            </button>

            <button
            type="button"
            className={
                formData.licenseType === "BUSINESS"
                ? "active"
                : ""
            }
            onClick={() =>
                setFormData((prev) => ({
                ...prev,
                licenseType: "BUSINESS",
                details: {},
                }))
            }
            >
            🏢 Business
            </button>
        </div>
        </div>

        {/* Full Name */}
        <label>
          Full Name

          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={updateField}
            placeholder="Juan Dela Cruz"
            required
          />
        </label>

        {/* Birth Date */}
        <label>
          Birth Date

          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={updateField}
            required
          />
        </label>

        {/* Address */}
        <label className="full">
          Residential Address

          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={updateField}
            placeholder="123 Main Street"
            required
          />
        </label>

        {/* Contact */}
        <label className="full">
          Contact Number

          <input
            type="text"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={updateField}
            placeholder="+63 912 345 6789"
            required
          />
        </label>

        <div className="full">
          <div className="panel-heading application-subheading">
            <div>
              <p className="eyebrow">
                LICENSE DETAILS
              </p>

              <h3>
                Additional Information
              </h3>
            </div>
          </div>

          {/* PART 2 STARTS HERE */}

          {formData.licenseType === "DRIVER" && (
            <DriverForm
              details={formData.details}
              setDetails={updateDetails}
            />
          )}

          {formData.licenseType === "PRC" && (
            <PRCForm
              details={formData.details}
              setDetails={updateDetails}
            />
          )}

          {formData.licenseType === "BUSINESS" && (
            <BusinessForm
              details={formData.details}
              setDetails={updateDetails}
            />
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="primary auth-submit"
            type="submit"
            disabled={busy}
          >
            {busy
              ? "Submitting..."
              : formData.applicationType === "NEW"
              ? "Submit Application"
              : "Submit Renewal"}

            <span>→</span>
          </button>

          <p className="helper">
            {formData.applicationType === "NEW"
              ? "After verification, you'll receive a payment request. Once payment is confirmed, your ProofPass NFT license will be minted on Bitcoin Cash."
              : "After your renewal request is approved and payment is confirmed, your existing ProofPass NFT will be updated with the renewed license information."}
          </p>
        </div>
      </form>
    </section>
  );
}