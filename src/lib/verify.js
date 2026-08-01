import { binToHex, decodeCashAddress } from '@bitauth/libauth';
import { decodeLicenseCommitment } from './token';

export const STATUS = Object.freeze({ VALID: 'Valid', EXPIRED: 'Expired', REVOKED: 'Revoked', INVALID: 'Invalid' });

function isLicenseUtxo(utxo, category, commitment) {
  return utxo.token?.category === category
    && utxo.token?.nft?.capability === 'none'
    && (!commitment || utxo.token.nft.commitment === commitment);
}

function hashFromCashAddress(address) {
  const decoded = decodeCashAddress(address.trim());
  if (typeof decoded === 'string') throw new Error('The supplied owner address is not a valid CashAddress.');
  return binToHex(decoded.payload);
}

/**
 * Verify a license from chain UTXOs plus the optional browser-side revocation index.
 * A third party can independently prove Valid/Expired using the covenant UTXO. The explicit
 * Revoked label needs the issuer's index because a burned NFT is otherwise indistinguishable
 * from a never-issued or already-spent NFT.
 */
export async function verifyLicense({ contract, category, query, claimedOwnerAddress, knownLicenses = [] }) {
  const normalizedQuery = query.trim().toLowerCase();
  const indexed = knownLicenses.find((license) =>
    license.id.toLowerCase() === normalizedQuery || license.commitment?.toLowerCase() === normalizedQuery,
  );

  if (indexed?.status === 'Revoked') return { status: STATUS.REVOKED, license: indexed, reason: 'Issuer revocation was recorded.' };
  if (!indexed && !/^[0-9a-f]{62}$/i.test(normalizedQuery)) {
    return { status: STATUS.INVALID, reason: 'Enter a known License ID or a 31-byte commitment.' };
  }

  const utxos = await contract.getUtxos();
  const commitment = indexed?.commitment ?? normalizedQuery;
  const activeUtxo = utxos.find((utxo) => isLicenseUtxo(utxo, category, commitment));
  if (!activeUtxo) return { status: STATUS.INVALID, license: indexed, reason: 'No active license NFT exists at the covenant.' };

  const decoded = decodeLicenseCommitment(commitment);
  const license = { ...indexed, ...decoded, commitment, utxo: activeUtxo };
  if (claimedOwnerAddress && hashFromCashAddress(claimedOwnerAddress) !== decoded.holderPublicKeyHash) {
    return { status: STATUS.INVALID, license, reason: 'The claimed wallet does not match the holder hash in the NFT.' };
  }
  if (decoded.expiresAt <= Math.floor(Date.now() / 1000)) {
    return { status: STATUS.EXPIRED, license, reason: 'The active NFT has passed its committed expiry date.' };
  }
  return { status: STATUS.VALID, license, reason: 'Active covenant NFT, owner binding, and expiry all check out.' };
}

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
