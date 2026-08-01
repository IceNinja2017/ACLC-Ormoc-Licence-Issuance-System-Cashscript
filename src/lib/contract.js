import { Contract, ElectrumNetworkProvider, SignatureTemplate, TransactionBuilder } from 'cashscript';
import LicenseArtifact from '../contracts/License.json';
import { AUTHORITY_COMMITMENT, DUST_SATOSHIS, authorityToken, licenseNft } from './token';

const DEFAULT_MINER_FEE = 2500n;

/** Create a Chipnet/Testnet provider. The SDK also has built-in server selection. */
export function createProvider(network = 'chipnet', hostname) {
  return new ElectrumNetworkProvider(network, hostname ? { hostname } : undefined);
}

/** Instantiate the covenant after the token category (the bootstrap input txid) is known. */
export function createLicenseContract({ issuerPublicKey, tokenCategory, renewalFee, provider }) {
  return new Contract(
    LicenseArtifact,
    [issuerPublicKey, tokenCategory, AUTHORITY_COMMITMENT, BigInt(renewalFee)],
    { provider },
  );
}

export function isAuthorityUtxo(utxo, category) {
  return utxo.token?.category === category
    && utxo.token?.nft?.capability === 'minting'
    && utxo.token?.nft?.commitment === AUTHORITY_COMMITMENT;
}

export function isLicenseUtxo(utxo, category, commitment) {
  return utxo.token?.category === category
    && utxo.token?.nft?.capability === 'none'
    && (!commitment || utxo.token.nft.commitment === commitment);
}

export async function findAuthorityUtxo(contract, category) {
  const authority = (await contract.getUtxos()).find((utxo) => isAuthorityUtxo(utxo, category));
  if (!authority) throw new Error('Authority NFT not found. Bootstrap the category and fund its covenant UTXO first.');
  return authority;
}

/**
 * Bootstrap a new category and lock its one minting NFT directly in the covenant.
 * CashTokens derives a category from the transaction ID of input output #0; requiring vout 0
 * makes that relationship explicit and lets us calculate the covenant address before broadcast.
 */
export async function bootstrapAuthority({ fundingUtxo, issuerWallet, contract, provider, category, authoritySatoshis = 100000n }) {
  if (fundingUtxo.vout !== 0) throw new Error('Choose an issuer BCH UTXO with vout 0 for CashToken genesis.');
  if (fundingUtxo.txid !== category) throw new Error('Category must equal the selected bootstrap UTXO transaction ID.');
  if (fundingUtxo.satoshis <= authoritySatoshis + DEFAULT_MINER_FEE) throw new Error('Bootstrap UTXO is too small.');

  // This is the only mint operation outside the covenant: it creates its retained authority NFT.
  return new TransactionBuilder({ provider, maximumFeeSatoshis: DEFAULT_MINER_FEE })
    .addInput(fundingUtxo, new SignatureTemplate(issuerWallet.privateKey).unlockP2PKH())
    .addOutput({ to: contract.tokenAddress, amount: authoritySatoshis, token: authorityToken(category) })
    .addBchChangeOutputIfNeeded({ to: issuerWallet.address, feeRate: 1 })
    .send();
}

/** Issue one immutable license NFT. The contract enforces issuer authorization and output locations. */
export async function issueLicense({ contract, category, issuerWallet, commitment, licenseSatoshis = DUST_SATOSHIS }) {
  const authority = await findAuthorityUtxo(contract, category);
  const nextAuthorityValue = authority.satoshis - licenseSatoshis - DEFAULT_MINER_FEE;
  if (nextAuthorityValue < DUST_SATOSHIS) throw new Error('Authority UTXO needs more BCH reserve before issuing.');

  return new TransactionBuilder({ provider: contract.provider, maximumFeeSatoshis: DEFAULT_MINER_FEE })
    .addInput(authority, contract.unlock.issue(commitment, new SignatureTemplate(issuerWallet.privateKey)))
    // Output position 0: authority is preserved. Position 1: one new immutable license.
    .addOutput({ to: contract.tokenAddress, amount: nextAuthorityValue, token: authorityToken(category) })
    .addOutput({ to: contract.tokenAddress, amount: licenseSatoshis, token: licenseNft(category, commitment) })
    .send();
}

/** Renew by replacing the old immutable NFT with a fresh one containing only a later expiry. */
export async function renewLicense({ contract, category, holderWallet, issuerAddress, oldCommitment, newCommitment, renewalFee }) {
  const utxos = await contract.getUtxos();
  const license = utxos.find((utxo) => isLicenseUtxo(utxo, category, oldCommitment));
  const authority = utxos.find((utxo) => isAuthorityUtxo(utxo, category));
  if (!license || !authority) throw new Error('Current license or minting authority UTXO is missing.');

  const nextAuthorityValue = authority.satoshis - BigInt(renewalFee) - DEFAULT_MINER_FEE;
  if (nextAuthorityValue < DUST_SATOSHIS) throw new Error('Authority UTXO needs more BCH reserve before renewing.');
  const template = new SignatureTemplate(holderWallet.privateKey);
  const unlock = () => contract.unlock.renew(oldCommitment, newCommitment, holderWallet.publicKeyHex, template);

  return new TransactionBuilder({ provider: contract.provider, maximumFeeSatoshis: DEFAULT_MINER_FEE })
    // Input ordering is part of the covenant's security rule.
    .addInput(license, unlock())
    .addInput(authority, unlock())
    .addOutput({ to: contract.tokenAddress, amount: license.satoshis, token: licenseNft(category, newCommitment) })
    .addOutput({ to: contract.tokenAddress, amount: nextAuthorityValue, token: authorityToken(category) })
    .addOutput({ to: issuerAddress, amount: BigInt(renewalFee) })
    .send();
}

/** Revoke burns the immutable NFT. It is deliberately never recreated in an output. */
export async function revokeLicense({ contract, category, issuerWallet, commitment }) {
  const utxos = await contract.getUtxos();
  const license = utxos.find((utxo) => isLicenseUtxo(utxo, category, commitment));
  if (!license) throw new Error('Active license UTXO was not found. It may already be revoked or spent.');
  if (license.satoshis <= DEFAULT_MINER_FEE + 546n) throw new Error('License UTXO does not contain enough BCH to pay its revoke fee.');

  return new TransactionBuilder({ provider: contract.provider, maximumFeeSatoshis: DEFAULT_MINER_FEE })
    .addInput(license, contract.unlock.revoke(commitment, new SignatureTemplate(issuerWallet.privateKey)))
    // Exactly one non-token P2PKH output is required by the contract; the NFT is burned.
    .addOutput({ to: issuerWallet.address, amount: license.satoshis - DEFAULT_MINER_FEE })
    .send();
}
