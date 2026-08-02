// Reads per-license-type configuration from environment variables, using the
// <PREFIX>_* naming convention. PREFIX is the license type key upper-cased
// (e.g. "prc" -> PRC_*). Each deployed license type has its own category ID,
// vault addresses, fees, and term length — see scripts/deploy.js.

const TYPES = ['DRIVER', 'PRC', 'BUSINESS'];

function typeConfig(typeKey) {
  const prefix = typeKey.toUpperCase();
  const categoryId = process.env[`${prefix}_ISSUER_CATEGORY_ID`];
  if (!categoryId) return null;

  return {
    type: typeKey,
    prefix,
    categoryId,
    issuerTokenAddress: process.env[`${prefix}_ISSUER_TOKEN_ADDRESS`] || '',
    licenseVaultAddress: process.env[`${prefix}_LICENSE_VAULT_ADDRESS`] || '',
    licenseVaultTokenAddress: process.env[`${prefix}_LICENSE_VAULT_TOKEN_ADDRESS`] || '',
    renewalFeeSats: Number(process.env[`${prefix}_RENEWAL_FEE_SATS`] || 1000),
    issuanceFeeSats: Number(process.env[`${prefix}_ISSUANCE_FEE_SATS`] || 5000),
    termLengthBlocks: Number(process.env[`${prefix}_TERM_LENGTH_BLOCKS`] || 4320),
  };
}

export function getLicenseTypes() {
  return TYPES.map(typeConfig).filter(Boolean);
}

export function getLicenseType(typeKey) {
  const upper = String(typeKey || '').toUpperCase();
  if (!TYPES.includes(upper)) return null;
  return typeConfig(upper);
}

export function getLicenseTypeByCategory(categoryId) {
  return getLicenseTypes().find((t) => t.categoryId === categoryId) || null;
}

// Global (shared across all types) constructor args for LicenseVault.
export function getGlobalVaultArgs() {
  return {
    adminPkHex: process.env.ADMIN_PUBLIC_KEY_HEX || '',
    treasuryLockingBytecode: process.env.TREASURY_LOCKING_BYTECODE || '',
    treasuryChipnetAddress: process.env.TREASURY_CHIPNET_ADDRESS || '',
  };
}

// The relayer key is the one server-held key in the whole system. It is NOT the
// admin key. It is scoped to "can pay small chipnet fees" — it funds the BCH
// input that covers the renewal fee output + miner fee. The covenant itself
// checks no signature for renew(), so this key authorizes nothing on-chain.
export function getRelayerKey() {
  const hex = process.env.RELAYER_PRIVATE_KEY_HEX;
  if (!hex) return null;
  return hex;
}

export const TREASURY_CHIPNET_ADDRESS = () => process.env.TREASURY_CHIPNET_ADDRESS || '';
export const ADMIN_PUBLIC_KEY_HEX = () => process.env.ADMIN_PUBLIC_KEY_HEX || '';
export const ADMIN_ADDRESSES = () =>
  (process.env.ADMIN_ADDRESSES || '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);