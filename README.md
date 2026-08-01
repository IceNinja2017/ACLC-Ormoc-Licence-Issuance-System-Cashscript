# ProofPass: Mocknet License Prototype

ProofPass is a beginner-friendly, browser-only prototype of professional licenses represented as soulbound NFTs. It models the CashToken and CashScript lifecycle locally, so the core product flow can be developed without wallets, private keys, test BCH, or a blockchain connection.

## Quick start

```bash
npm install
npm run compile
npm run dev
```

Open the printed local URL. The app opens in Demo mode. Switch to **Mocknet setup** to test the complete local lifecycle.

## Mocknet workflow

1. Create a local issuer identity and a local holder identity.
2. Copy the holder identity into the **Holder identity** field in the issuer form.
3. Click **Bootstrap mock authority**. This creates a simulated CashToken category and covenant address.
4. Issue a license. Mocknet gives the transaction a simulated transaction ID and creates a 31-byte license commitment.
5. Renew the license using the same local holder identity. This consumes the old simulated NFT and creates a replacement with a later expiry.
6. Revoke the license as the issuer. This marks the simulated NFT as burned.
7. Verify by license ID, commitment, or holder identity.

Mocknet state is browser-only. Refreshing the page clears generated identities and the Mocknet bootstrap state; the display license list is retained in browser local storage until reset.

## License commitment model

The implementation preserves the CashToken NFT commitment shape: a fixed 31-byte record containing a version, active state, holder hash, expiry, license type, and random license ID nonce.

| Bytes | Value |
| --- | --- |
| 0 | Format version (`01`) |
| 1 | State (`01` active) |
| 2–21 | Holder identity hash (20 bytes) |
| 22–25 | Expiry timestamp (4 bytes) |
| 26 | License-type code |
| 27–30 | License ID nonce |

The Mocknet identity hash is a deterministic local stand-in for a blockchain public-key hash. It exists only to exercise the same commitment and ownership-binding flow during development.

## What Mocknet proves

- The product flow and form validation for issuing, renewing, revoking, and verifying credentials.
- License-state transitions and expiry handling.
- The data structure that will be committed in a CashToken NFT.
- The UI's owner-binding rules without exposing or managing private keys.

## What it does not prove

Mocknet never broadcasts transactions, pays BCH fees, or executes the CashScript covenant in the BCH virtual machine. Before a real deployment, re-enable a Chipnet or private-regtest integration and test the compiled contract with real CashToken transactions.

## Project structure

- `src/lib/mocknet.js` — local identities, simulated categories/transactions, and Mocknet verification.
- `src/lib/token.js` — license commitment encoding and decoding.
- `contracts/License.cash` — CashScript covenant retained for later blockchain integration.
- `src/lib/contract.js` — Chipnet/CashScript transaction builders retained for later integration work.
