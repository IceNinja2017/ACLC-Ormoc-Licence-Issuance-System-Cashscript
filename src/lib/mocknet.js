import { STATUS } from './verify';

/**
 * A browser-only development network. It deliberately models identifiers and
 * transaction results, but never broadcasts a transaction or handles funds.
 */
const randomHex = (bytes) => {
  const value = crypto.getRandomValues(new Uint8Array(bytes));
  return [...value].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const mockTransaction = () => ({ txid: randomHex(32) });

export function createMockIdentity(role) {
  const suffix = randomHex(6);
  return {
    role,
    address: `mock:${role}-${suffix}`,
    publicKeyHash: ownerHash(`mock:${role}-${suffix}`),
  };
}

export function bootstrapMocknet() {
  const category = randomHex(32);
  return {
    category,
    contractAddress: `mock:covenant-${category.slice(0, 12)}`,
    ...mockTransaction(),
  };
}

// This is a deterministic stand-in for HASH160 in the local development flow.
// It preserves the same 20-byte shape required by the NFT commitment encoder.
export function ownerHash(value) {
  let state = 0x811c9dc5;
  for (const character of value) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 0x01000193) >>> 0;
  }
  let hex = '';
  for (let index = 0; index < 5; index += 1) {
    state = Math.imul(state ^ (state >>> 16), 0x45d9f3b) >>> 0;
    hex += state.toString(16).padStart(8, '0');
  }
  return hex;
}

export function verifyMockLicense({ query, claimedOwnerAddress, licenses }) {
  const normalized = query.trim().toLowerCase();
  const license = licenses.find((item) =>
    item.id.toLowerCase() === normalized
    || item.commitment?.toLowerCase() === normalized
    || item.holderAddress.toLowerCase() === normalized,
  );
  if (!license) return { status: STATUS.INVALID, reason: 'No Mocknet license matched this ID, commitment, or identity.' };
  if (license.status === STATUS.REVOKED) return { status: STATUS.REVOKED, license, reason: 'The Mocknet revocation transaction burned this license.' };
  if (claimedOwnerAddress && claimedOwnerAddress !== license.holderAddress) {
    return { status: STATUS.INVALID, license, reason: 'The claimed Mocknet identity does not match this license owner.' };
  }
  if (new Date(license.expiresAt).getTime() <= Date.now()) {
    return { status: STATUS.EXPIRED, license, reason: 'The Mocknet license has passed its committed expiry date.' };
  }
  return { status: STATUS.VALID, license, reason: 'Mocknet authority, owner binding, and expiry checks passed.' };
}
