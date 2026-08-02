// Wallet connection + identity via WizardConnect (Paytaca's dapp protocol).
// Paytaca is a BCH wallet that uses WizardConnect for dapp integration.
// Docs: https://gitlab.com/riftenlabs/lib/wizardconnect
//
// WizardConnect is NOT WalletConnect — it's a relay-based protocol specific
// to BCH. The wallet shares xpubs; the dapp derives addresses from them. The
// wallet signs transactions on the user's approval.
import { hash160 } from '@cashscript/utils';
import { binToHex, encodeCashAddress } from '@bitauth/libauth';

// Module-level singleton holding the DappConnectionManager after connect.
let connectionManager = null;

export function setConnectionManager(m) {
  connectionManager = m;
}

export function getConnectionManager() {
  return connectionManager;
}

export function clearConnectionManager() {
  connectionManager = null;
}

// Derive the first receive address (child index 0, address index 0) from
// the wallet's shared xpub.
export function getWalletAddress() {
  if (!connectionManager) throw new Error('Wallet not connected.');
  const pubkey = connectionManager.getPubkey(0, 0n);
  if (!pubkey) throw new Error('No pubkey available for child 0 / index 0.');
  const pkh = hash160(pubkey);
  return encodeCashAddress({ prefix: 'bchtest', type: 'p2pkh', payload: pkh });
}

// Get the compressed public key hex for the first receive address.
// This is what goes into ADMIN_PUBLIC_KEY_HEX.
export function getWalletPublicKeyHex() {
  if (!connectionManager) throw new Error('Wallet not connected.');
  const pubkey = connectionManager.getPubkey(0, 0n);
  if (!pubkey) throw new Error('No pubkey available.');
  return binToHex(pubkey);
}

// Sign a BCH transaction via WizardConnect. The wallet shows the tx to the
// user, they approve, and the signed transaction hex comes back.
export async function signTransaction(transactionHex, inputPaths) {
  if (!connectionManager) throw new Error('Wallet not connected.');
  const { hexToBin } = await import('@bitauth/libauth');
  const response = await connectionManager.signTransaction({
    transaction: hexToBin(transactionHex),
    inputPaths,
  });
  return {
    signedTxHex: binToHex(response.signedTransaction || response.transaction || new Uint8Array()),
    signatures: response.signatures || [],
  };
}