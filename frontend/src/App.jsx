import { useEffect, useState } from 'react';
import IssuerPanel from './components/IssuerPanel';
import HolderPanel from './components/HolderPanel';
import VerifyPanel from './components/VerifyPanel';
import { decodeLicenseCommitment, encodeLicenseCommitment, licenseTypeCode, randomLicenseNonce } from './lib/token';
import { verifyDemoLicense } from './lib/verify';
import { bootstrapMocknet, createMockIdentity, mockTransaction, ownerHash, verifyMockLicense } from './lib/mocknet';
import { createPersistedLicense, loadPersistedLicenses, updatePersistedLicense } from './lib/licenseApi';
import { logoutUser } from './lib/auth';
import AuthPage from './pages/AuthPage';

const STORAGE_KEY = 'proofpass-demo-licenses-v1';
const USER_STORAGE_KEY = 'proofpass-user-session-v1';
const INITIAL_LICENSES = [{ id: 'PP-84291', holderName: 'Alice Santos', holderAddress: 'mock:holder-alice-demo', licenseType: 'Professional License', expiresAt: '2027-08-01T00:00:00.000Z', status: 'Valid', commitment: 'demo-commitment-84291' }];

function readLicenses() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? INITIAL_LICENSES; } catch { return INITIAL_LICENSES; }
}

function readSavedUser() {
  try { return JSON.parse(localStorage.getItem(USER_STORAGE_KEY)); } catch { return null; }
}

export default function App() {
  const [licenses, setLicenses] = useState(readLicenses);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState('Demo registry ready — no wallet, server, or test funds needed.');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('demo');
  const [mocknet, setMocknet] = useState({ issuer: null, holder: null, category: '', contractAddress: '' });
  const [user, setUser] = useState(readSavedUser);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(licenses)), [licenses]);
  useEffect(() => {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  }, [user]);
  useEffect(() => {
    let cancelled = false;
    loadPersistedLicenses().then((persisted) => {
      if (!cancelled && persisted?.length) setLicenses(persisted);
    });
    return () => { cancelled = true; };
  }, []);
  const run = async (work) => { setBusy(true); try { await work(); } catch (error) { setNotice(error.message || 'The transaction could not be completed.'); } finally { setBusy(false); } };
  function issue(form) { run(async () => {
    const holderIdentity = form.holderAddress.trim().toLowerCase();
    const duplicate = licenses.find((license) =>
      license.status !== 'Revoked'
      && license.holderAddress.trim().toLowerCase() === holderIdentity
      && license.licenseType === form.licenseType,
    );
    if (duplicate) {
      throw new Error(`${form.holderName} already has an active ${form.licenseType} (${duplicate.id}). Revoke it before issuing a replacement.`);
    }
    if (mode === 'mocknet') {
      if (!mocknet.category || !mocknet.issuer) throw new Error('Create an issuer identity and bootstrap Mocknet before issuing.');
      const nonce = randomLicenseNonce();
      const commitment = encodeLicenseCommitment({ holderPublicKeyHash: ownerHash(form.holderAddress), expiresAt: Math.floor(new Date(`${form.expiresAt}T00:00:00Z`).getTime() / 1000), typeCode: licenseTypeCode(form.licenseType), nonce });
      const transaction = mockTransaction();
      const id = `PP-${nonce}`;
      const license = { ...form, id, expiresAt: new Date(`${form.expiresAt}T00:00:00Z`).toISOString(), status: 'Valid', commitment, txid: transaction.txid, category: mocknet.category };
      setLicenses((all) => [license, ...all]);
      const persisted = await createPersistedLicense(license);
      setNotice(`${id} issued on Mocknet: ${transaction.txid.slice(0, 14)}…${persisted ? ' Saved to the local API.' : ' Stored in this browser.'}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
    const id = `PP-${Math.floor(10000 + Math.random() * 89999)}`;
    setLicenses((all) => [{ ...form, id, expiresAt: new Date(`${form.expiresAt}T00:00:00Z`).toISOString(), status: 'Valid', commitment: `demo-${crypto.randomUUID()}` }, ...all]);
    setNotice(`${id} issued. In Mocknet mode, this simulates covenant-held NFT issuance.`);
  }); }
  function renew(license, years) { run(async () => {
    if (mode === 'mocknet') {
      if (!mocknet.holder || mocknet.holder.address !== license.holderAddress) {
        throw new Error('Select the matching holder Mocknet identity before renewing this license.');
      }
      const oldData = decodeLicenseCommitment(license.commitment);
      const expiry = new Date(oldData.expiresAt * 1000); expiry.setFullYear(expiry.getFullYear() + years);
      const newCommitment = encodeLicenseCommitment({ holderPublicKeyHash: oldData.holderPublicKeyHash, expiresAt: Math.floor(expiry.getTime() / 1000), typeCode: oldData.typeCode, nonce: oldData.nonce });
      const transaction = mockTransaction();
      setLicenses((all) => all.map((item) => item.id === license.id ? { ...item, commitment: newCommitment, expiresAt: expiry.toISOString(), status: 'Valid', txid: transaction.txid } : item));
      const persisted = await updatePersistedLicense(license.id, { commitment: newCommitment, expiresAt: expiry.toISOString(), status: 'Valid', txid: transaction.txid });
      setNotice(`${license.id} renewed on Mocknet: ${transaction.txid.slice(0, 14)}…${persisted ? ' Saved to the local API.' : ' Stored in this browser.'}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
    const expiry = new Date(license.expiresAt); expiry.setFullYear(expiry.getFullYear() + years);
    setLicenses((all) => all.map((item) => item.id === license.id ? { ...item, expiresAt: expiry.toISOString(), status: 'Valid' } : item));
    setNotice(`${license.id} renewed for ${years} year${years > 1 ? 's' : ''}; the old NFT would be consumed on-chain.`);
  }); }
  function revoke(license) { run(async () => {
    if (mode === 'mocknet') {
      if (!mocknet.issuer) throw new Error('Create an issuer Mocknet identity before revoking licenses.');
      const transaction = mockTransaction();
      setLicenses((all) => all.map((item) => item.id === license.id ? { ...item, status: 'Revoked', txid: transaction.txid } : item));
      const persisted = await updatePersistedLicense(license.id, { status: 'Revoked', txid: transaction.txid });
      setNotice(`${license.id} revoked on Mocknet: ${transaction.txid.slice(0, 14)}…${persisted ? ' Saved to the local API.' : ' Stored in this browser.'}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
    setLicenses((all) => all.map((item) => item.id === license.id ? { ...item, status: 'Revoked' } : item));
    setNotice(`${license.id} revoked; in the covenant this burns the active NFT.`);
  }); }
  async function verify(values) {
    if (mode !== 'mocknet') { setResult(verifyDemoLicense({ ...values, licenses })); return; }
    setResult(verifyMockLicense({ ...values, licenses }));
  }
  function generateMockIdentity(role) { run(async () => {
    const identity = createMockIdentity(role);
    setMocknet((current) => ({ ...current, [role]: identity }));
    setNotice(`New ${role} Mocknet identity created locally. No key, funds, or server are required.`);
  }); }
  function bootstrap() { run(async () => {
    if (!mocknet.issuer) throw new Error('Create an issuer Mocknet identity first.');
    const bootstrapped = bootstrapMocknet();
    setMocknet((value) => ({ ...value, category: bootstrapped.category, contractAddress: bootstrapped.contractAddress }));
    setNotice(`Mock authority created at ${bootstrapped.contractAddress}; bootstrap tx ${bootstrapped.txid.slice(0, 14)}…`);
  }); }
  function resetDemo() { localStorage.removeItem(STORAGE_KEY); setLicenses(INITIAL_LICENSES); setResult(null); setNotice('Demo data restored.'); }
  function authenticated(nextUser, message) { setUser(nextUser); setNotice(message || `Signed in as ${nextUser.username}.`); setShowDashboard(true); }
  function loggedOut(message) { setUser(null); setNotice(message || 'You have been signed out.'); setShowDashboard(false); }
  function exploreDemo() { setUser(null); setNotice('Demo registry ready — no account required.'); setShowDashboard(true); }
  async function signOut() {
    try {
      const payload = await logoutUser();
      loggedOut(payload.message);
    } catch (error) {
      setNotice(error.message || 'Unable to sign out.');
    }
  }

  if (!showDashboard) return <AuthPage onAuthenticated={authenticated} onExploreDemo={exploreDemo} />;

  return <main><nav><a className="brand" href="#top"><span>⌁</span>ProofPass</a><div className="nav-center"><a href="#issuer">Issuer</a><a href="#holder">Holder</a><a href="#verify">Verify</a></div><div className="nav-actions"><button className="quiet nav-auth" type="button" onClick={user ? signOut : () => setShowDashboard(false)}>{user ? 'Sign out' : 'Sign in'}</button><button className="mode" onClick={() => setMode(mode === 'demo' ? 'mocknet' : 'demo')}><i className={mode} />{mode === 'demo' ? 'Demo mode' : 'Mocknet setup'}</button></div></nav>
    <header id="top" className="hero"><div><p className="eyebrow">CASH TOKENS × CASHSCRIPT</p><h1>Licenses that <em>belong</em><br />to one person.</h1><p className="lede">A non-transferable credential prototype. Build and test its complete lifecycle locally before connecting to a blockchain.</p><div className="hero-actions"><a className="primary" href="#issuer">Explore the flow <span>↓</span></a><button className="quiet" onClick={resetDemo}>Reset demo</button></div></div><div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="nft-core">⌁<small>SOULBOUND<br />ON BCH</small></div><span className="float-chip chip-a">NFT</span><span className="float-chip chip-b">✓ VALID</span></div></header>
    <div className="notice"><span>●</span>{notice}</div>
    {mode === 'mocknet' && <section className="mocknet-callout"><strong>Mocknet setup — local development only.</strong><div className="wallet-setup"><div><span>Start with two local identities.</span><p>Mocknet has no private keys, test funds, Electrum server, or transaction broadcasts.</p></div><button className="quiet wallet-button" disabled={busy} onClick={() => generateMockIdentity('issuer')}>Create issuer identity</button><button className="quiet wallet-button" disabled={busy} onClick={() => generateMockIdentity('holder')}>Create holder identity</button></div>{Object.entries({ issuer: mocknet.issuer, holder: mocknet.holder }).filter(([, identity]) => identity).map(([role, identity]) => <div className="wallet-card" key={role}><div><b>{role} Mocknet identity</b><span>Use the holder identity below as the license recipient</span></div><code>{identity.address}</code></div>)}<div className="live-form"><input readOnly value={mocknet.category} placeholder="Mock CashToken category (bootstrap fills this)" /><input readOnly value={mocknet.contractAddress} placeholder="Mock covenant address (bootstrap fills this)" /><button className="secondary" disabled={busy} onClick={bootstrap}>Bootstrap mock authority</button></div><p>Copy the generated holder identity into the issuer form. Bootstrap creates a simulated token category and authority, then you can issue, renew, revoke, and verify licenses locally.</p></section>}
    <div className="content"><div id="issuer"><IssuerPanel licenses={licenses} onIssue={issue} onRevoke={revoke} busy={busy} /></div><div id="holder"><HolderPanel licenses={licenses} onRenew={renew} busy={busy} /></div><div id="verify"><VerifyPanel onVerify={verify} result={result} /></div></div>
    <footer><span>ProofPass MVP · Local Mocknet development mode</span><span>CashScript lifecycle model · Mock NFTs · Browser-only</span></footer>
  </main>;
}
