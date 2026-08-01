import { useState } from 'react';

const licenseTypes = ['Professional License', 'Identity Credential', 'Safety Certification', 'Training Certificate'];

export default function IssuerPanel({ licenses, onIssue, onRevoke, busy }) {
  const [form, setForm] = useState({ holderName: '', holderAddress: '', licenseType: licenseTypes[0], expiresAt: '2027-08-01' });
  const activeLicenses = licenses.filter((license) => license.status !== 'Revoked');

  function submit(event) {
    event.preventDefault();
    onIssue(form);
    setForm((current) => ({ ...current, holderName: '' }));
  }

  return <section className="panel issuer-panel">
    <div className="panel-heading"><div><p className="eyebrow">Issuer workspace</p><h2>Issue protected credentials</h2></div><span className="icon-orb">✦</span></div>
    <form className="form-grid" onSubmit={submit}>
      <label>Holder name<input required value={form.holderName} onChange={(event) => setForm({ ...form, holderName: event.target.value })} placeholder="e.g. Alice Santos" /></label>
      <label>Holder token address<input required value={form.holderAddress} onChange={(event) => setForm({ ...form, holderAddress: event.target.value })} placeholder="bchtest:z…" /></label>
      <label>License type<select value={form.licenseType} onChange={(event) => setForm({ ...form, licenseType: event.target.value })}>{licenseTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>Expires on<input required type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label>
      <button className="primary" disabled={busy}>Issue soulbound NFT <span>→</span></button>
    </form>
    <p className="helper">Issuance creates an immutable CashToken NFT locked at the License covenant—not in the holder’s wallet.</p>

    <div className="subheading"><h3>Issued licenses</h3><span>{licenses.length} total</span></div>
    <div className="license-list">{licenses.map((license) => <article className="license-row" key={license.id}>
      <div className="license-seal">⌁</div><div className="license-copy"><strong>{license.holderName}</strong><span>{license.licenseType} · {license.id}</span></div>
      <div className="row-meta"><span className={`status ${license.status.toLowerCase()}`}>{license.status}</span><small>Expires {new Date(license.expiresAt).toLocaleDateString()}</small></div>
      {license.status !== 'Revoked' && <button className="text-danger" disabled={busy} onClick={() => onRevoke(license)}>Revoke</button>}
    </article>)}</div>
    {!activeLicenses.length && <p className="empty">No active licenses yet.</p>}
  </section>;
}
