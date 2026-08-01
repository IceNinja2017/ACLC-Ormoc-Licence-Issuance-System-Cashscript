import {
  CashAddressType,
  binToHex,
  decodeCashAddress,
  decodePrivateKeyWif,
  encodeCashAddress,
  encodePrivateKeyWif,
  generatePrivateKey,
  hash160,
  instantiateSecp256k1,
} from '@bitauth/libauth';

// Chipnet uses the testnet CashAddress prefix, even though it is a separate network.
const prefixForNetwork = (network) => (network === 'mainnet' ? 'bitcoincash' : 'bchtest');
const wifTypeForNetwork = (network) => (network === 'mainnet' ? 'mainnet' : 'testnet');

// libauth returns `{ address }` on successful CashAddress encoding. Keep that
// library detail at this boundary so React always receives a plain string.
function encodedAddress(result) {
  if (typeof result === 'string') throw new Error(result);
  return result.address;
}

/** Convert a private key to the public information needed by CashScript. */
export async function walletFromPrivateKey(privateKey, network = 'chipnet') {
  const secp256k1 = await instantiateSecp256k1();
  const publicKey = secp256k1.derivePublicKeyCompressed(privateKey);
  if (typeof publicKey === 'string') throw new Error(publicKey);

  const publicKeyHash = hash160(publicKey);
  return {
    privateKey,
    publicKeyHex: binToHex(publicKey),
    publicKeyHashHex: binToHex(publicKeyHash),
    // A token-aware address is useful for receiving CashTokens. It has the same P2PKH script.
    tokenAddress: encodedAddress(encodeCashAddress({
      prefix: prefixForNetwork(network),
      type: CashAddressType.p2pkhWithTokens,
      payload: publicKeyHash,
    })),
    address: encodedAddress(encodeCashAddress({
      prefix: prefixForNetwork(network),
      type: CashAddressType.p2pkh,
      payload: publicKeyHash,
    })),
  };
}

/** Import a WIF without ever sending it to a server. */
export async function walletFromWif(wif, network = 'chipnet') {
  const decoded = decodePrivateKeyWif(wif.trim());
  if (typeof decoded === 'string') throw new Error(decoded);
  return walletFromPrivateKey(decoded.privateKey, network);
}

/** Make a local demo/test wallet. Save its WIF yourself before refreshing. */
export async function createWallet(network = 'chipnet') {
  const privateKey = generatePrivateKey();
  const wallet = await walletFromPrivateKey(privateKey, network);
  return { ...wallet, wif: encodePrivateKeyWif(privateKey, wifTypeForNetwork(network)) };
}

/** Extract the 20-byte ownership hash from a BCH or token-aware CashAddress. */
export function publicKeyHashFromAddress(address) {
  const decoded = decodeCashAddress(address.trim());
  if (typeof decoded === 'string') throw new Error(`Invalid CashAddress: ${decoded}`);
  if (decoded.payload.length !== 20) throw new Error('Expected a 20-byte P2PKH CashAddress.');
  return binToHex(decoded.payload);
}

export function shortAddress(address = '') {
  return address.length > 18 ? `${address.slice(0, 11)}…${address.slice(-6)}` : address;
}
