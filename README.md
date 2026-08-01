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
>>>>>>>>> Temporary merge branch 2
