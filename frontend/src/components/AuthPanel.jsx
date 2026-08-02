import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../lib/auth";

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
    setForm((current) => ({ ...current, [name]: value }));
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
        const payload = await registerUser({
          username: form.username,
          email: form.email,
          password: form.password,
        });
        if (!payload.success) throw new Error(payload.message);
        switchView("login");
      } else {
        const payload = await loginUser({
          email: form.email,
          password: form.password,
        });
        if (!payload.success) throw new Error(payload.message);
        localStorage.setItem("user", JSON.stringify(payload.user));
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err?.message || "Unable to complete the request.");
    } finally {
      setBusy(false);
    }
  }

  const isRegistering = view === "register";

  return (
    <section className="auth-panel panel" aria-labelledby="account-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">SECURE ACCESS</p>
          <h2 id="account-heading">{isRegistering ? "Create your account" : "Welcome back"}</h2>
        </div>
        <span className="icon-orb mint" aria-hidden="true">⌁</span>
      </div>

      <div className="auth-tabs" role="tablist" aria-label="Account access">
        <button
          className={view === "login" ? "active" : ""}
          type="button"
          role="tab"
          aria-selected={view === "login"}
          onClick={() => switchView("login")}
        >
          Sign In
        </button>
        <button
          className={view === "register" ? "active" : ""}
          type="button"
          role="tab"
          aria-selected={view === "register"}
          onClick={() => switchView("register")}
        >
          Register
        </button>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {isRegistering && (
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

        {isRegistering && (
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
          <p className="auth-error" role="alert">{error}</p>
        )}

        <button
          className="primary auth-submit"
          type="submit"
          disabled={busy}
        >
          {busy ? "Please wait..." : isRegistering ? "Create Account" : "Sign In"}
          <span>→</span>
        </button>
      </form>

      <p className="helper">
        {isRegistering
          ? "Create your ProofPass account."
          : "Sign in using your registered email and password."}
      </p>
    </section>
  );
}