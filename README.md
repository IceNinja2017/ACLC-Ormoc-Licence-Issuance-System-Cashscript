# ProofPass: BCH Soulbound License MVP

ProofPass is a beginner-friendly, browser-only demo of professional licenses on Bitcoin Cash. Each active license is an **immutable CashToken NFT** held in a CashScript covenant. The covenant only permits issue, renew, and revoke transactions; it never permits a wallet-to-wallet transfer.

> Hackathon scope: this project is deliberately small and uses browser `localStorage` as its optional display index. The chain and contract are the source of truth for the current NFT UTXO. Never use a demo wallet or private key with real funds.

## Quick start

```bash
npm install
npm run compile
npm run dev
```

Open the printed local URL. Start in **Demo mode** to explore the full flow without a wallet. Turn on **Chipnet mode** when you have funded Chipnet WIFs and a configured Electrum server.

## How the license commitment works

CashToken NFT commitments are limited to 40 bytes. `src/lib/token.js` encodes this fixed 31-byte commitment:

| Bytes | Value |
| --- | --- |
| 0 | format version (`01`) |
| 1 | state (`01` active) |
| 2–21 | holder public-key hash (20 bytes) |
| 22–25 | expiry Unix timestamp (4-byte big endian) |
| 26 | license-type code |
| 27–30 | license ID nonce |

The readable title and type name are presentation data, indexed locally by the app. They are not an authorization input. Ownership and expiry are committed in the NFT itself.

## Lifecycle

1. **Bootstrap (one time):** create a CashToken category with a minting NFT, deploy the `License` covenant for that category, then lock the minting NFT in the covenant.
2. **Issue:** issuer spends the minting-authority UTXO. The covenant requires the issuer signature, recreates the minting authority, and creates an immutable active-license NFT at its own address.
3. **Renew:** holder co-spends their license UTXO and the covenant minting-authority UTXO. The contract requires the holder signature, destroys the old NFT, recreates authority, and mints a replacement NFT with a later expiry. The fee is paid to the issuer.
4. **Revoke:** issuer spends the active license UTXO and the covenant permits the NFT to be burned. A burned contract NFT cannot be renewed or transferred.

The minting authority does not represent a license and should not be displayed as one.

## Security model

- **Unauthorized issue / revoke:** the `issuerPk` constructor value is checked with `checkSig`.
- **Unauthorized renewal:** the commitment’s holder hash is checked against the renewing public key, then `checkSig` verifies it.
- **NFT transfer:** all issue and renewal paths require their active NFT output to use the exact same covenant bytecode; normal wallet outputs fail script validation.
- **Token substitution:** the contract compares the CashToken category and the full commitment expected at each fixed input/output position.
- **Double spend:** BCH’s UTXO consensus lets a contract output be spent only once.
- **Invalid ownership claims:** verifier decodes the on-chain commitment and compares its holder hash with the wallet address supplied by the claimant.

## Chipnet testing checklist

1. Use only Chipnet funds. Get test BCH from a current Chipnet faucet.
2. Create separate issuer and holder wallets in the UI, or import WIFs for each. Keep WIFs local; the app never sends them to a server.
3. Configure an Electrum endpoint that supports Chipnet and CashTokens in the Network section.
4. Run the one-time bootstrap helper in `src/lib/contract.js`; record the category ID, contract address, and authority outpoint in the browser’s local index.
5. Issue a license, renew it with the holder wallet, and verify with the holder token address or license ID.
6. Try building a normal token transfer: the NFT is locked by the covenant, so it has no transfer branch and will fail.

## Important MVP limitations

- The app’s license list and explicit `Revoked` label are local browser indexes. A separate verifier can independently prove an active, unexpired NFT by querying the contract address, but needs an issuer-published revocation index to label a deliberately burned NFT as revoked rather than simply absent.
- This sample uses fixed transaction positions for clarity. It is audited educational code, not production-grade custody software.
- The contract artifact is generated locally into `src/contracts/License.json` and is intentionally not committed.
