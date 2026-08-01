import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const EMPTY_REGISTER_FORM = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function AuthPanel() {
  const navigate = useNavigate();

  const [view, setView] = useState("login");
  const [form, setForm] = useState(EMPTY_REGISTER_FORM);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function switchView(nextView) {
    setView(nextView);
    setError("");
    setForm(EMPTY_REGISTER_FORM);
  }

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError("");

    try {
      if (view === "register") {
        if (form.password !== form.confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const { data } = await axios.post(`${API_URL}/api/user/register`, {
          username: form.username,
          email: form.email,
          password: form.password,
        });

        if (!data.success) {
          throw new Error(data.message);
        }

        alert(data.message);
        switchView("login");
      } else {
        const { data } = await axios.post(`${API_URL}/api/user/login`, {
          email: form.email,
          password: form.password,
        });

        if (!data.success) {
          throw new Error(data.message);
        }

        // Save JWT
        localStorage.setItem("token", data.token);

        // Save user
        localStorage.setItem("user", JSON.stringify(data.user));

        // Go to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to complete the request."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-panel panel" aria-labelledby="account-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">SECURE ACCESS</p>
          <h2 id="account-heading">
            {view === "register"
              ? "Create your account"
              : "Welcome back"}
          </h2>
        </div>

        <span className="icon-orb mint" aria-hidden="true">
          ⌁
        </span>
      </div>

      <div
        className="auth-tabs"
        role="tablist"
        aria-label="Account access"
      >
        <button
          className={view === "login" ? "active" : ""}
          type="button"
          onClick={() => switchView("login")}
        >
          Sign In
        </button>

        <button
          className={view === "register" ? "active" : ""}
          type="button"
          onClick={() => switchView("register")}
        >
          Register
        </button>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {view === "register" && (
          <label>
            Username
            <input
              name="username"
              value={form.username}
              onChange={updateField}
              minLength={3}
              required
            />
          </label>
        )}

        <label>
          Email Address
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            required
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            minLength={8}
            required
          />
        </label>

        {view === "register" && (
          <label>
            Confirm Password
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={updateField}
              minLength={8}
              required
            />
          </label>
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
            ? "Please wait..."
            : view === "register"
            ? "Create Account"
            : "Sign In"}

          <span>→</span>
        </button>
      </form>

      <p className="helper">
        {view === "register"
          ? "Create your ProofPass account."
          : "Sign in using your registered email and password."}
      </p>
    </section>
  );
}