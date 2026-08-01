export const STATUS = Object.freeze({ VALID: 'Valid', EXPIRED: 'Expired', REVOKED: 'Revoked', INVALID: 'Invalid' });

/** Local-only demo equivalent used while there is no blockchain contract configured. */
export function verifyDemoLicense({ query, claimedOwnerAddress, licenses }) {
  const normalized = query.trim().toLowerCase();
  const license = licenses.find((item) => item.id.toLowerCase() === normalized || item.holderAddress.toLowerCase() === normalized);
  if (!license) return { status: STATUS.INVALID, reason: 'No license matched this ID or wallet address.' };
  if (license.status === 'Revoked') return { status: STATUS.REVOKED, license, reason: 'Issuer revocation was recorded.' };
  if (claimedOwnerAddress && claimedOwnerAddress !== license.holderAddress) {
    return { status: STATUS.INVALID, license, reason: 'The claimed wallet does not match the license owner.' };
  }
  if (new Date(license.expiresAt).getTime() <= Date.now()) return { status: STATUS.EXPIRED, license, reason: 'The license has expired.' };
  return { status: STATUS.VALID, license, reason: 'NFT, expiry, and owner binding are valid in this demo registry.' };
}
