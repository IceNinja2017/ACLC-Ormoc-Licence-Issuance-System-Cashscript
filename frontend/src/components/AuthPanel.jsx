import { useState } from 'react';
import { loginUser, logoutUser, registerUser } from '../lib/auth';

const EMPTY_REGISTER_FORM = {
  username: '',
  email: '',
  password: '',
  address: '',
  walletAddress: '',
};

export default function AuthPanel({ user, onAuthenticated, onLoggedOut }) {
  const [view, setView] = useState('login');
  const [form, setForm] = useState(EMPTY_REGISTER_FORM);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function switchView(nextView) {
    setView(nextView);
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = view === 'login'
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser(form);
      setForm(EMPTY_REGISTER_FORM);
      onAuthenticated(payload.user, payload.message);
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete the request.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError('');
    try {
      const payload = await logoutUser();
      onLoggedOut(payload.message);
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign out.');
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return <section className="auth-panel panel" aria-labelledby="account-heading">
      <div className="panel-heading">
        <div><p className="eyebrow">YOUR PROOFPASS ACCOUNT</p><h2 id="account-heading">You’re signed in</h2></div>
        <span className="icon-orb mint" aria-hidden="true">✓</span>
      </div>
      <div className="account-summary">
        <div className="account-avatar" aria-hidden="true">{user.username?.slice(0, 1).toUpperCase() || 'U'}</div>
        <div><strong>{user.username}</strong><span>{user.email}</span><small>{user.role || 'USER'} account</small></div>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="quiet auth-logout" type="button" disabled={busy} onClick={signOut}>{busy ? 'Signing out…' : 'Sign out'}</button>
    </section>;
  }

  const isRegistering = view === 'register';
  return <section className="auth-panel panel" aria-labelledby="account-heading">
    <div className="panel-heading">
      <div><p className="eyebrow">SECURE ACCESS</p><h2 id="account-heading">{isRegistering ? 'Create your account' : 'Welcome back'}</h2></div>
      <span className="icon-orb mint" aria-hidden="true">⌁</span>
    </div>
    <div className="auth-tabs" role="tablist" aria-label="Account access">
      <button className={view === 'login' ? 'active' : ''} type="button" role="tab" aria-selected={view === 'login'} onClick={() => switchView('login')}>Sign in</button>
      <button className={view === 'register' ? 'active' : ''} type="button" role="tab" aria-selected={view === 'register'} onClick={() => switchView('register')}>Register</button>
    </div>
    <form className="auth-form" onSubmit={submit}>
      {isRegistering && <label>Username<input name="username" value={form.username} onChange={updateField} autoComplete="username" minLength="3" required /></label>}
      <label>Email address<input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" value={form.password} onChange={updateField} autoComplete={isRegistering ? 'new-password' : 'current-password'} minLength="8" required /></label>
      {isRegistering && <><label>Residential address<input name="address" value={form.address} onChange={updateField} autoComplete="street-address" required /></label><label>Cash wallet address<input name="walletAddress" value={form.walletAddress} onChange={updateField} spellCheck="false" placeholder="bitcoincash:…" required /></label></>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="primary auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'} <span>→</span></button>
    </form>
    <p className="helper">{isRegistering ? 'Your password is securely hashed before it is saved.' : 'Use the email and password linked to your ProofPass account.'}</p>
  </section>;
}
