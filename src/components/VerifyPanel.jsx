import { useState } from 'react';

export default function VerifyPanel({ onVerify, result }) {
  const [query, setQuery] = useState('');
  const [owner, setOwner] = useState('');
  function submit(event) { event.preventDefault(); onVerify({ query, claimedOwnerAddress: owner }); }
  const license = result?.license;
  const expiryDate = license && new Date(typeof license.expiresAt === 'number' ? license.expiresAt * 1000 : license.expiresAt);
  return <section className="panel verify-panel">
    <div className="panel-heading"><div><p className="eyebrow">Public verifier</p><h2>Verify any credential</h2></div><span className="icon-orb mint">✓</span></div>
    <form className="verify-form" onSubmit={submit}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="License ID or wallet address" required /><input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Claimed owner wallet (optional)" /><button className="primary">Verify <span>→</span></button></form>
    {result && <div className={`verification ${result.status.toLowerCase()}`}><div className="verification-status"><span className="result-icon">{result.status === 'Valid' ? '✓' : '!'}</span><div><p>Verification result</p><h3>{result.status}</h3></div></div><p>{result.reason}</p>
      {license && <dl><div><dt>Owner</dt><dd>{license.holderName ?? license.holderPublicKeyHash}</dd></div><div><dt>License type</dt><dd>{license.licenseType}</dd></div><div><dt>Expiration</dt><dd>{expiryDate.toLocaleDateString()}</dd></div><div><dt>License ID</dt><dd>{license.id ?? `#${license.nonce}`}</dd></div></dl>}
    </div>}
    {!result && <p className="helper">Mocknet checks the simulated covenant record, expiry, revocation state, and optional claimed owner.</p>}
  </section>;
}
