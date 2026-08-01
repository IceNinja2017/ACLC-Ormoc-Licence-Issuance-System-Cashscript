import { useEffect, useState } from 'react';
import IssuerPanel from './components/IssuerPanel';
import HolderPanel from './components/HolderPanel';
import VerifyPanel from './components/VerifyPanel';
import { bootstrapAuthority, createLicenseContract, createProvider, issueLicense, renewLicense, revokeLicense } from './lib/contract';
import { decodeLicenseCommitment, encodeLicenseCommitment, licenseTypeCode, randomLicenseNonce } from './lib/token';
import { verifyDemoLicense, verifyLicense } from './lib/verify';
import { createWallet, publicKeyHashFromAddress, walletFromWif } from './lib/wallet';

const STORAGE_KEY = 'proofpass-demo-licenses-v1';
const INITIAL_LICENSES = [{ id: 'PP-84291', holderName: 'Alice Santos', holderAddress: 'bchtest:zr8aliceproofpassholder4gjw9n63rtf2yspq', licenseType: 'Professional License', expiresAt: '2027-08-01T00:00:00.000Z', status: 'Valid', commitment: 'demo-commitment-84291' }];

function readLicenses() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? INITIAL_LICENSES; } catch { return INITIAL_LICENSES; }
}

export default function App() {
  const [licenses, setLicenses] = useState(readLicenses);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState('Demo registry ready — no wallet or server needed.');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('demo');
  const [live, setLive] = useState({ issuerWif: '', holderWif: '', category: '', renewalFee: '1000', electrumHost: '' });
  const [wallets, setWallets] = useState({ issuer: null, holder: null });

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(licenses)), [licenses]);
  const run = async (work) => { setBusy(true); try { await work(); } catch (error) { setNotice(error.message || 'The transaction could not be completed.'); } finally { setBusy(false); } };
  const liveContext = async () => {
    if (!live.issuerWif || !live.category) throw new Error('Enter an issuer Chipnet WIF and a token category first.');
    const issuerWallet = await walletFromWif(live.issuerWif, 'chipnet');
    const provider = createProvider('chipnet', live.electrumHost || undefined);
    const contract = createLicenseContract({ issuerPublicKey: issuerWallet.publicKeyHex, tokenCategory: live.category, renewalFee: BigInt(live.renewalFee), provider });
    return { issuerWallet, provider, contract };
  };

  function issue(form) { run(async () => {
    if (mode === 'chipnet') {
      const { issuerWallet, contract } = await liveContext();
      const nonce = randomLicenseNonce();
      const commitment = encodeLicenseCommitment({ holderPublicKeyHash: publicKeyHashFromAddress(form.holderAddress), expiresAt: Math.floor(new Date(`${form.expiresAt}T00:00:00Z`).getTime() / 1000), typeCode: licenseTypeCode(form.licenseType), nonce });
      const transaction = await issueLicense({ contract, category: live.category, issuerWallet, commitment });
      const id = `PP-${nonce}`;
      setLicenses((all) => [{ ...form, id, expiresAt: new Date(`${form.expiresAt}T00:00:00Z`).toISOString(), status: 'Valid', commitment, txid: transaction.txid }, ...all]);
      setNotice(`${id} issued on Chipnet: ${transaction.txid.slice(0, 14)}…`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
    const id = `PP-${Math.floor(10000 + Math.random() * 89999)}`;
    setLicenses((all) => [{ ...form, id, expiresAt: new Date(`${form.expiresAt}T00:00:00Z`).toISOString(), status: 'Valid', commitment: `demo-${crypto.randomUUID()}` }, ...all]);
    setNotice(`${id} issued. In Chipnet mode, this step calls issueLicense() and creates the covenant-held NFT.`);
  }); }
  function renew(license, years) { run(async () => {
    if (mode === 'chipnet') {
      if (!live.holderWif) throw new Error('Enter the current holder’s Chipnet WIF to renew.');
      const { issuerWallet, contract } = await liveContext();
      const holderWallet = await walletFromWif(live.holderWif, 'chipnet');
      const oldData = decodeLicenseCommitment(license.commitment);
      const expiry = new Date(oldData.expiresAt * 1000); expiry.setFullYear(expiry.getFullYear() + years);
      const newCommitment = encodeLicenseCommitment({ holderPublicKeyHash: oldData.holderPublicKeyHash, expiresAt: Math.floor(expiry.getTime() / 1000), typeCode: oldData.typeCode, nonce: oldData.nonce });
      const transaction = await renewLicense({ contract, category: live.category, holderWallet, issuerAddress: issuerWallet.address, oldCommitment: license.commitment, newCommitment, renewalFee: BigInt(live.renewalFee) });
      setLicenses((all) => all.map((item) => item.id === license.id ? { ...item, commitment: newCommitment, expiresAt: expiry.toISOString(), status: 'Valid', txid: transaction.txid } : item));
      setNotice(`${license.id} renewed on Chipnet: ${transaction.txid.slice(0, 14)}…`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
    const expiry = new Date(license.expiresAt); expiry.setFullYear(expiry.getFullYear() + years);
    setLicenses((all) => all.map((item) => item.id === license.id ? { ...item, expiresAt: expiry.toISOString(), status: 'Valid' } : item));
    setNotice(`${license.id} renewed for ${years} year${years > 1 ? 's' : ''}; the old NFT would be consumed on-chain.`);
  }); }
  function revoke(license) { run(async () => {
    if (mode === 'chipnet') {
      const { issuerWallet, contract } = await liveContext();
      const transaction = await revokeLicense({ contract, category: live.category, issuerWallet, commitment: license.commitment });
      setLicenses((all) => all.map((item) => item.id === license.id ? { ...item, status: 'Revoked', txid: transaction.txid } : item));
      setNotice(`${license.id} revoked on Chipnet: ${transaction.txid.slice(0, 14)}…`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
    setLicenses((all) => all.map((item) => item.id === license.id ? { ...item, status: 'Revoked' } : item));
    setNotice(`${license.id} revoked; in the covenant this burns the active NFT.`);
  }); }
  async function verify(values) {
    if (mode !== 'chipnet') { setResult(verifyDemoLicense({ ...values, licenses })); return; }
    await run(async () => { const { contract } = await liveContext(); setResult(await verifyLicense({ contract, category: live.category, query: values.query, claimedOwnerAddress: values.claimedOwnerAddress, knownLicenses: licenses })); });
  }
  function updateLive(event) { setLive({ ...live, [event.target.name]: event.target.value }); }
  function generateChipnetWallet(role) { run(async () => {
    const wallet = await createWallet('chipnet');
    setWallets((current) => ({ ...current, [role]: wallet }));
    setLive((current) => ({ ...current, [`${role}Wif`]: wallet.wif }));
    setNotice(`New ${role} Chipnet wallet created locally. Fund its BCH address with test BCH before bootstrapping.`);
  }); }
  function showImportedWallets() { run(async () => {
    const nextWallets = {};
    if (live.issuerWif) nextWallets.issuer = { ...(await walletFromWif(live.issuerWif, 'chipnet')), wif: live.issuerWif };
    if (live.holderWif) nextWallets.holder = { ...(await walletFromWif(live.holderWif, 'chipnet')), wif: live.holderWif };
    if (!nextWallets.issuer && !nextWallets.holder) throw new Error('Enter at least one WIF first.');
    setWallets((current) => ({ ...current, ...nextWallets }));
  }); }
  function bootstrap() { run(async () => {
    if (!live.issuerWif) throw new Error('Enter an issuer Chipnet WIF first.');
    const issuerWallet = await walletFromWif(live.issuerWif, 'chipnet');
    const provider = createProvider('chipnet', live.electrumHost || undefined);
    const fundingUtxo = (await provider.getUtxos(issuerWallet.address)).find((utxo) => utxo.vout === 0 && !utxo.token && utxo.satoshis > 120000n);
    if (!fundingUtxo) throw new Error('Fund issuer address with a non-token UTXO at vout 0 containing at least 120,000 sats.');
    const category = fundingUtxo.txid;
    const contract = createLicenseContract({ issuerPublicKey: issuerWallet.publicKeyHex, tokenCategory: category, renewalFee: BigInt(live.renewalFee), provider });
    const transaction = await bootstrapAuthority({ fundingUtxo, issuerWallet, contract, provider, category });
    setLive((value) => ({ ...value, category }));
    setNotice(`Authority NFT locked in covenant ${contract.tokenAddress}; bootstrap tx ${transaction.txid.slice(0, 14)}…`);
  }); }
  function resetDemo() { localStorage.removeItem(STORAGE_KEY); setLicenses(INITIAL_LICENSES); setResult(null); setNotice('Demo data restored.'); }

  return <main><nav><a className="brand" href="#top"><span>⌁</span>ProofPass</a><div className="nav-center"><a href="#issuer">Issuer</a><a href="#holder">Holder</a><a href="#verify">Verify</a></div><button className="mode" onClick={() => setMode(mode === 'demo' ? 'chipnet' : 'demo')}><i className={mode} />{mode === 'demo' ? 'Demo mode' : 'Chipnet setup'}</button></nav>
    <header id="top" className="hero"><div><p className="eyebrow">CASH TOKENS × CASHSCRIPT</p><h1>Licenses that <em>belong</em><br />to one person.</h1><p className="lede">A non-transferable Bitcoin Cash credential system. Issue, renew, revoke, and verify—all without a database or backend.</p><div className="hero-actions"><a className="primary" href="#issuer">Explore the flow <span>↓</span></a><button className="quiet" onClick={resetDemo}>Reset demo</button></div></div><div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="nft-core">⌁<small>SOULBOUND<br />ON BCH</small></div><span className="float-chip chip-a">NFT</span><span className="float-chip chip-b">✓ VALID</span></div></header>
    <div className="notice"><span>●</span>{notice}</div>
    {mode === 'chipnet' && <section className="chipnet-callout"><strong>Chipnet setup — test funds only.</strong><div className="wallet-setup"><div><span>New to Chipnet?</span><p>Create temporary keys here. They stay in this browser until refresh.</p></div><button className="quiet wallet-button" disabled={busy} onClick={() => generateChipnetWallet('issuer')}>Create issuer wallet</button><button className="quiet wallet-button" disabled={busy} onClick={() => generateChipnetWallet('holder')}>Create holder wallet</button><button className="quiet wallet-button" disabled={busy} onClick={showImportedWallets}>Show imported addresses</button></div>{Object.entries(wallets).filter(([, wallet]) => wallet).map(([role, wallet]) => <div className="wallet-card" key={role}><div><b>{role} wallet</b><span>Fund this BCH address</span></div><code>{wallet.address}</code><div><b>Token address</b><span>Use this as the license recipient address</span></div><code>{wallet.tokenAddress}</code><details><summary>Show test WIF backup</summary><code>{wallet.wif}</code></details></div>)}<div className="live-form"><input name="issuerWif" type="password" value={live.issuerWif} onChange={updateLive} placeholder="Issuer WIF (stored only in page memory)" /><input name="holderWif" type="password" value={live.holderWif} onChange={updateLive} placeholder="Holder WIF (needed only for renewal)" /><input name="category" value={live.category} onChange={updateLive} placeholder="CashToken category (bootstrap fills this)" /><input name="renewalFee" value={live.renewalFee} onChange={updateLive} placeholder="Renewal fee (sats)" /><input name="electrumHost" value={live.electrumHost} onChange={updateLive} placeholder="Optional Chipnet Electrum host" /><button className="secondary" disabled={busy} onClick={bootstrap}>Bootstrap authority</button></div><p>Fund the issuer’s BCH address with a non-token UTXO at output index 0 containing at least 120,000 sats. The holder’s token address is the recipient for issued licenses. WIFs never leave this browser; refresh clears them.</p></section>}
    <div className="content"><div id="issuer"><IssuerPanel licenses={licenses} onIssue={issue} onRevoke={revoke} busy={busy} /></div><div id="holder"><HolderPanel licenses={licenses} onRenew={renew} busy={busy} /></div><div id="verify"><VerifyPanel onVerify={verify} result={result} /></div></div>
    <footer><span>ProofPass MVP · Built for Bitcoin Cash Chipnet</span><span>CashScript covenant · Immutable CashToken NFTs · Browser-only</span></footer>
  </main>;
}
