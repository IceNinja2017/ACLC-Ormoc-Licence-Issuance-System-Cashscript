import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';
import {
  Contract,
  ElectrumNetworkProvider,
  Network,
  SignatureTemplate,
} from 'cashscript';
import { binToHex, hexToBin } from '@bitauth/libauth';
import { hash160, sha256 } from '@cashscript/utils';
import {
  getLicenseType,
  getLicenseTypeByCategory,
  getGlobalVaultArgs,
  getRelayerKey,
} from '../src/licenseTypes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function cfg(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`${name} must be configured.`);
  return value;
}

// ---------------------------------------------------------------------------
// Artifact loading (lazy, cached)
// ---------------------------------------------------------------------------

let issuerArtifact = null;
let vaultArtifact = null;

async function loadArtifacts() {
  if (!issuerArtifact) {
    issuerArtifact = JSON.parse(
      await readFile(resolve(__dirname, '../../contracts/artifacts/Issuer.json'), 'utf8')
    );
  }
  if (!vaultArtifact) {
    vaultArtifact = JSON.parse(
      await readFile(resolve(__dirname, '../../contracts/artifacts/LicenseVault.json'), 'utf8')
    );
  }
  return { issuerArtifact, vaultArtifact };
}

// ---------------------------------------------------------------------------
// Network provider
// ---------------------------------------------------------------------------

let provider = null;

export function getProvider() {
  if (!provider) {
    const network = (process.env.CHIPNET_NETWORK || 'chipnet').toLowerCase() === 'chipnet'
      ? Network.CHIPNET
      : Network.TESTNET3;
    const electrumUrl = process.env.CHIPNET_ELECTRUM_URL || undefined;
    provider = new ElectrumNetworkProvider(network, electrumUrl ? { server: { url: electrumUrl } } : undefined);
  }
  return provider;
}

// ---------------------------------------------------------------------------
// Contract instantiation
// ---------------------------------------------------------------------------

// The Issuer contract's address is deterministic from adminPk. All three
// license types share the same Issuer (and same LicenseVault) when their
// constructor args are identical — only the category IDs differ.
export async function getIssuerContract() {
  const { issuerArtifact } = await loadArtifacts();
  const adminPk = hexToBin(cfg('ADMIN_PUBLIC_KEY_HEX'));
  return new Contract({
    artifact: issuerArtifact,
    arguments: [adminPk],
    provider: getProvider(),
    addressType: 'p2sh20',
  });
}

export async function getVaultContract(expectedAddress) {
  const { vaultArtifact } = await loadArtifacts();
  const { adminPkHex, treasuryLockingBytecode } = getGlobalVaultArgs();
  if (!adminPkHex) throw new Error('ADMIN_PUBLIC_KEY_HEX must be configured.');
  if (!treasuryLockingBytecode) throw new Error('TREASURY_LOCKING_BYTECODE must be configured.');
  // Use a per-type fee/term if the caller knows the type, otherwise fall back
  // to a reasonable default. The vault ADDRESS is what matters for UTXO lookup;
  // the constructor args must match what deploy.js used.
  const renewalFeeSats = Number(process.env.PRC_RENEWAL_FEE_SATS || 1000);
  const termLengthBlocks = Number(process.env.PRC_TERM_LENGTH_BLOCKS || 4320);

  const vault = new Contract({
    artifact: vaultArtifact,
    arguments: [hexToBin(adminPkHex), hexToBin(treasuryLockingBytecode), renewalFeeSats, termLengthBlocks],
    provider: getProvider(),
    addressType: 'p2sh20',
  });

  if (expectedAddress && vault.address !== expectedAddress) {
    throw new Error(
      `Reconstructed vault address ${vault.address} does not match expected ${expectedAddress}. Check ADMIN_PUBLIC_KEY_HEX / TREASURY_LOCKING_BYTECODE / fee / term.`
    );
  }
  return vault;
}

// ---------------------------------------------------------------------------
// 40-byte commitment codec (matches LicenseVault.cash)
//   [0..4)   serial      uint32 LE
//   [4..24)  holderPkh   hash160 (20 bytes)
//   [24..28) expiry      uint32 LE (block height)
//   [28]     classId     uint8
//   [29]     flags       uint8 (bit0 = suspended)
//   [30..40) nameTag     10 bytes
// ---------------------------------------------------------------------------

const u32ToHexLe = (n) => {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(n >>> 0);
  return buf.toString('hex');
};
const hexLeToU32 = (hex) => Buffer.from(hex, 'hex').readUInt32LE(0);

export function encodeCommitment({ serial, holderPkhHex, expiryBlock, classId, flags, nameTagHex }) {
  if (!/^[0-9a-f]{40}$/i.test(holderPkhHex)) throw new Error('holderPkhHex must be 20 bytes hex');
  const tag = (nameTagHex || '').padEnd(20, '0').slice(0, 20);
  return (
    u32ToHexLe(serial) +
    holderPkhHex.toLowerCase() +
    u32ToHexLe(expiryBlock) +
    (classId & 0xff).toString(16).padStart(2, '0') +
    (flags & 0xff).toString(16).padStart(2, '0') +
    tag
  );
}

export function decodeCommitment(commitmentHex) {
  if (!/^[0-9a-f]{80}$/i.test(commitmentHex)) throw new Error('commitment must be 40 bytes hex');
  return {
    serial: hexLeToU32(commitmentHex.slice(0, 8)),
    holderPkh: commitmentHex.slice(8, 48),
    expiryBlock: hexLeToU32(commitmentHex.slice(48, 56)),
    classId: parseInt(commitmentHex.slice(56, 58), 16),
    flags: parseInt(commitmentHex.slice(58, 60), 16),
    nameTag: commitmentHex.slice(60, 80),
  };
}

// ---------------------------------------------------------------------------
// hash160 helper for callers that pass hex strings
// ---------------------------------------------------------------------------

export function hash160Hex(hexString) {
  return binToHex(hash160(hexToBin(hexString)));
}

export { hash160, sha256, binToHex, hexToBin };

// ---------------------------------------------------------------------------
// Issuer.issue — admin signs in their OWN wallet, server never holds the key.
// This function builds the unsigned transaction and returns it for the admin's
// wallet to sign + broadcast. (For an MVP path where the admin WIF is set, we
// fall back to signing server-side — but the design intent is wallet signing.)
// ---------------------------------------------------------------------------

export async function issueLicense({ licenseType, commitmentHex }) {
  const type = getLicenseType(licenseType);
  if (!type) throw new Error(`License type "${licenseType}" is not configured.`);

  const issuer = await getIssuerContract();
  const vault = await getVaultContract(type.licenseVaultAddress);
  const vaultLockingBytecode = vault.lockingBytecode;

  const utxos = await issuer.getUtxos();
  const authorityUtxo = utxos.find(
    (u) => u.token?.nft?.capability === 'minting' && u.token?.category?.startsWith(type.categoryId)
  );
  if (!authorityUtxo) {
    throw new Error(`No minting-authority UTXO for category ${type.categoryId} at the Issuer covenant. Run deploy.js ${licenseType} first.`);
  }

  const tx = await issuer.functions
    .issue(undefined, vaultLockingBytecode, hexToBin(commitmentHex))
    .from(authorityUtxo)
    .toOutputs([
      { to: issuer.address, amount: 1000n, token: authorityUtxo.token },
      {
        to: type.licenseVaultAddress,
        amount: 1000n,
        token: {
          category: type.categoryId + '01',
          amount: 0n,
          nft: { capability: 'mutable', commitment: hexToBin(commitmentHex) },
        },
      },
    ])
    .withHardcodedInputs([authorityUtxo])
    .build();

  // Return the unsigned PSBT/hex for the admin wallet to sign + broadcast.
  return {
    unsignedTransactionHex: tx.bitcoinCash,
    issuerAddress: issuer.address,
    vaultAddress: type.licenseVaultAddress,
    category: type.categoryId,
    commitment: commitmentHex,
  };
}

// ---------------------------------------------------------------------------
// LicenseVault.renew — permissionless (no signature), relayer pays the BCH fee.
// ---------------------------------------------------------------------------

export async function renewLicense({ licenseType, commitmentHex }) {
  const type = getLicenseType(licenseType);
  if (!type) throw new Error(`License type "${licenseType}" is not configured.`);

  const vault = await getVaultContract(type.licenseVaultAddress);
  const utxos = await vault.getUtxos();
  const licenseUtxo = utxos.find(
    (u) => u.token?.nft?.commitment && binToHex(u.token.nft.commitment) === commitmentHex
  );
  if (!licenseUtxo) throw new Error('No license NFT UTXO found at the vault for this commitment.');

  const decoded = decodeCommitment(commitmentHex);
  const newExpiryBlock = decoded.expiryBlock + type.termLengthBlocks;
  const newCommitment = encodeCommitment({ ...decoded, expiryBlock: newExpiryBlock });

  const relayerKeyHex = getRelayerKey();
  if (!relayerKeyHex) throw new Error('RELAYER_PRIVATE_KEY_HEX must be configured to relay renewals.');

  // The relayer funds the BCH input that covers the renewal fee output + miner fee.
  // This key is NOT the admin key and authorizes nothing on-chain (renew needs no sig).
  const relayerSig = new SignatureTemplate(hexToBin(relayerKeyHex));
  const relayerPk = relayerSig.publicKey;
  const relayerAddress = await deriveP2pkhAddress(relayerPk);

  const relayerUtxos = await getProvider().getUtxos(relayerAddress);
  if (!relayerUtxos.length) throw new Error('Relayer wallet has no UTXOs to fund the renewal.');

  const tx = await vault.functions
    .renew()
    .from(licenseUtxo)
    .fromP2PKH(relayerUtxos[0], relayerSig)
    .toOutputs([
      {
        to: vault.address,
        amount: 1000n,
        token: {
          category: licenseUtxo.token.category,
          amount: 0n,
          nft: { capability: 'mutable', commitment: hexToBin(newCommitment) },
        },
      },
      { to: type.treasuryAddress || getGlobalVaultArgs().treasuryChipnetAddress, amount: BigInt(type.renewalFeeSats) },
    ])
    .withHardcodedInputs([licenseUtxo])
    .send();

  return { transactionId: tx.txid, commitment: newCommitment, expiryBlock: newExpiryBlock };
}

// ---------------------------------------------------------------------------
// LicenseVault.revoke — admin-signed burn. Admin signs in their wallet.
// Returns an unsigned transaction for the admin to sign, like issue().
// ---------------------------------------------------------------------------

export async function revokeLicense({ licenseType, commitmentHex }) {
  const type = getLicenseType(licenseType);
  if (!type) throw new Error(`License type "${licenseType}" is not configured.`);

  const vault = await getVaultContract(type.licenseVaultAddress);
  const utxos = await vault.getUtxos();
  const licenseUtxo = utxos.find(
    (u) => u.token?.nft?.commitment && binToHex(u.token.nft.commitment) === commitmentHex
  );
  if (!licenseUtxo) throw new Error('No license NFT UTXO found at the vault for this commitment.');

  const tx = await vault.functions
    .revoke(undefined)
    .from(licenseUtxo)
    .toOutputs([{ to: type.treasuryAddress || getGlobalVaultArgs().treasuryChipnetAddress, amount: 546n }])
    .withHardcodedInputs([licenseUtxo])
    .build();

  return {
    unsignedTransactionHex: tx.bitcoinCash,
    vaultAddress: type.licenseVaultAddress,
    category: type.categoryId,
    commitment: commitmentHex,
  };
}

// ---------------------------------------------------------------------------
// On-chain verification
// ---------------------------------------------------------------------------

export async function lookupToken(licenseType, commitmentHex) {
  const type = getLicenseType(licenseType);
  if (!type) return null;
  const vault = await getVaultContract(type.licenseVaultAddress);
  const utxos = await vault.getUtxos();
  const found = utxos.find(
    (u) => u.token?.nft?.commitment && binToHex(u.token.nft.commitment) === commitmentHex
  );
  if (!found) return null;
  return {
    exists: true,
    category: found.token.category,
    commitment: binToHex(found.token.nft.commitment),
    outpoint: `${found.txid}_${found.vout}`,
  };
}

// ---------------------------------------------------------------------------
// Treasury payment verification via Chipnet indexer
// ---------------------------------------------------------------------------

export async function verifyTreasuryPayment(transactionId, minimumSats, expectedTreasuryAddress) {
  if (!transactionId) throw new Error('A Chipnet payment transaction ID is required.');
  const baseUrl = cfg('CHIPNET_INDEXER_URL');
  const treasury = expectedTreasuryAddress || cfg('TREASURY_CHIPNET_ADDRESS');
  const { data } = await axios.get(`${baseUrl}/transactions/${encodeURIComponent(transactionId)}`);
  const outputs = data.outputs || data.vout || [];
  const paid = outputs.find(
    (o) =>
      (o.address === treasury || o.cashaddr === treasury) &&
      Number(o.value ?? o.satoshis) >= minimumSats
  );
  if (!paid) throw new Error('This transaction does not pay the required amount to the treasury.');
  const inputs = data.inputs || data.vin || [];
  const payerAddress = inputs[0]?.address || inputs[0]?.cashaddr;
  if (!payerAddress) throw new Error('Could not determine the payer address from this transaction.');
  return {
    transactionId,
    payerAddress,
    amountSats: Number(paid.value ?? paid.satoshis),
    verifiedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function deriveP2pkhAddress(pubkeyBytes) {
  const pkh = hash160(pubkeyBytes);
  const { encodeCashAddress } = await import('@bitauth/libauth');
  return encodeCashAddress({ prefix: 'bchtest', type: 'p2pkh', payload: pkh });
}