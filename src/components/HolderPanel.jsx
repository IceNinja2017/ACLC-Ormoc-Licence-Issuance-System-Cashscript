import { useMemo, useState } from 'react';

export default function HolderPanel({ licenses, onRenew, busy }) {
  const [selectedId, setSelectedId] = useState('');
  const [years, setYears] = useState(1);
  const licensesForSelect = useMemo(() => licenses.filter((license) => license.status !== 'Revoked'), [licenses]);
  const selected = licenses.find((license) => license.id === (selectedId || licensesForSelect[0]?.id));

  return <section className="panel holder-panel">
    <div className="panel-heading"><div><p className="eyebrow">Holder workspace</p><h2>Your license wallet</h2></div><span className="icon-orb amber">◈</span></div>
    {selected ? <>
      <div className="credential-card"><div className="credential-top"><span>PROOFPASS / BCH</span><span className={`status ${selected.status.toLowerCase()}`}>{selected.status}</span></div>
        <div className="credential-body"><span className="large-mark">⌁</span><div><h3>{selected.licenseType}</h3><p>{selected.holderName}</p><code>{selected.id}</code></div></div>
        <div className="credential-bottom"><span>OWNER</span><strong>{selected.holderAddress}</strong><span>EXPIRY</span><strong>{new Date(selected.expiresAt).toLocaleDateString()}</strong></div>
      </div>
      <div className="renewal-grid"><label>Choose license<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{licensesForSelect.map((license) => <option value={license.id} key={license.id}>{license.id} — {license.holderName}</option>)}</select></label>
        <label>Extension<select value={years} onChange={(event) => setYears(Number(event.target.value))}><option value={1}>1 year</option><option value={2}>2 years</option><option value={3}>3 years</option></select></label>
        <button className="secondary" disabled={busy || selected.status === 'Revoked'} onClick={() => onRenew(selected, years)}>Renew license <span>↗</span></button></div>
      <p className="helper">Renewal consumes the old NFT and mints a replacement with the same holder hash and license ID, but a later expiry.</p>
    </> : <p className="empty">Issue a license from the issuer dashboard to see it here.</p>}
  </section>;
}
