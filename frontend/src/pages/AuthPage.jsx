import AuthPanel from "../components/AuthPanel";

export default function AuthPage() {
  return (
    <main className="auth-home">
      <nav className="auth-nav">
        <a className="brand" href="#top">
          <span>⌁</span>
          ProofPass
        </a>
      </nav>

      <section id="top" className="auth-page-layout">
        <div className="auth-page-copy">
          <p className="eyebrow">
            CREDENTIALS ON BITCOIN CASH
          </p>

          <h1>
            Access credentials that <em>stay yours.</em>
          </h1>

          <p>
            Sign in to manage secure, non-transferable professional
            licenses, or create an account to get started.
          </p>

          <div className="auth-points">
            <span>✓ Secure account access</span>
            <span>✓ Soulbound license records</span>
            <span>✓ Independent verification</span>
          </div>
        </div>

        <div className="auth-page-card">
          <AuthPanel />
        </div>
      </section>

      <footer>
        <span>ProofPass MVP · Local development environment</span>
        <span>CashToken credentials · CashScript lifecycle</span>
      </footer>
    </main>
  );
}