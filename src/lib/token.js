// Import the browser-safe data helper directly (the package root also exports
// Node-only artifact utilities, which are unnecessary in this SPA).
import { encodeInt } from '@cashscript/utils/dist/data.js';

/**
 * CashToken NFT helpers.
 *
 * An immutable NFT is identified by `{ category, nft: { capability: 'none',
 * commitment } }`. The minting NFT uses the same category, but has the special
 * `minting` capability. It remains in the covenant and is never a license.
 */
export const AUTHORITY_COMMITMENT = 'a1';
export const COMMITMENT_BYTES = 31;
export const DUST_SATOSHIS = 1000n;

export const LICENSE_TYPES = {
  1: 'Professional License',
  2: 'Identity Credential',
  3: 'Safety Certification',
  4: 'Training Certificate',
};

export const licenseTypeCode = (name) =>
  Number(Object.entries(LICENSE_TYPES).find(([, label]) => label === name)?.[0] ?? 1);

const assertHex = (value, length, label) => {
  if (!new RegExp(`^[0-9a-f]{${length}}$`, 'i').test(value)) {
    throw new Error(`${label} must be ${length / 2} bytes of hexadecimal.`);
  }
};

// CashScript's int(bytes4) uses a little-endian script number. Keep dates below 2038.
export function uint32ToScriptNumberHex(value) {
  if (!Number.isInteger(value) || value < 0 || value > 0x7fffffff) {
    throw new Error('Expiry must be a Unix timestamp between 0 and January 2038.');
  }
  // @cashscript/utils produces the BCH Script-number bytes used by int(bytes4)
  // in License.cash. We pad them to the commitment's fixed four-byte field.
  const encoded = encodeInt(BigInt(value));
  const bytes = new Uint8Array(4);
  bytes.set(encoded);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function scriptNumberHexToUint32(hex) {
  assertHex(hex, 8, 'Expiry');
  const bytes = Uint8Array.from(hex.match(/../g).map((byte) => Number.parseInt(byte, 16)));
  return new DataView(bytes.buffer).getUint32(0, true);
}

/** Encode the compact on-chain license commitment described in the README. */
export function encodeLicenseCommitment({ holderPublicKeyHash, expiresAt, typeCode, nonce }) {
  assertHex(holderPublicKeyHash, 40, 'Holder public-key hash');
  if (!Number.isInteger(typeCode) || typeCode < 1 || typeCode > 255) throw new Error('Invalid license type.');
  if (!Number.isInteger(nonce) || nonce < 0 || nonce > 0xffffffff) throw new Error('Invalid license nonce.');
  const nonceHex = nonce.toString(16).padStart(8, '0');
  const commitment = `0101${holderPublicKeyHash.toLowerCase()}${uint32ToScriptNumberHex(expiresAt)}${typeCode
    .toString(16)
    .padStart(2, '0')}${nonceHex}`;
  if (commitment.length !== COMMITMENT_BYTES * 2) throw new Error('Commitment encoding has an unexpected size.');
  return commitment;
}

/** Decode public, non-sensitive facts embedded in an active license NFT. */
export function decodeLicenseCommitment(commitment) {
  assertHex(commitment, COMMITMENT_BYTES * 2, 'License commitment');
  if (commitment.slice(0, 4) !== '0101') throw new Error('This NFT is not an active ProofPass license.');
  const typeCode = Number.parseInt(commitment.slice(52, 54), 16);
  return {
    version: 1,
    state: 'active',
    holderPublicKeyHash: commitment.slice(4, 44),
    expiresAt: scriptNumberHexToUint32(commitment.slice(44, 52)),
    typeCode,
    licenseType: LICENSE_TYPES[typeCode] ?? `Unknown type (${typeCode})`,
    nonce: Number.parseInt(commitment.slice(54, 62), 16),
  };
}

export function randomLicenseNonce() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

/** Token object used by CashScript's TransactionBuilder for the retained authority. */
export function authorityToken(category) {
  return {
    category,
    amount: 0n,
    nft: { capability: 'minting', commitment: AUTHORITY_COMMITMENT },
  };
}

/** Token object used for a unique, immutable active license. */
export function licenseNft(category, commitment) {
  return {
    category,
    amount: 0n,
    nft: { capability: 'none', commitment },
  };
}
