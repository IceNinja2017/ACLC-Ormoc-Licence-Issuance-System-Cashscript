// Generate a fresh Chipnet keypair for the relayer.
// Prints the WIF, private key hex, public key hex, and bchtest: address.
//
// Usage:
//   node scripts/generateRelayerKey.js
//
// Then:
//   1. Copy RELAYER_PRIVATE_KEY_HEX into backend/.env
//   2. Fund the bchtest: address with a small amount of chipnet BCH from a faucet

import crypto from 'node:crypto';

// --- Helpers (declared first to avoid TDZ issues) ---

function hash160(buffer) {
  const sha = crypto.createHash('sha256').update(buffer).digest();
  const rip = crypto.createHash('ripemd160').update(sha).digest();
  return rip;
}

function encodeWifTestnet(privKey) {
  const payload = Buffer.concat([Buffer.from([0x80]), privKey]);
  const checksum = crypto.createHash('sha256').update(
    crypto.createHash('sha256').update(payload).digest()
  ).digest().slice(0, 4);
  return base58Encode(Buffer.concat([payload, checksum]));
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer) {
  let num = BigInt('0x' + buffer.toString('hex'));
  let encoded = '';
  while (num > 0n) {
    const rem = Number(num % 58n);
    encoded = BASE58_ALPHABET[rem] + encoded;
    num = num / 58n;
  }
  for (const byte of buffer) {
    if (byte === 0) encoded = '1' + encoded;
    else break;
  }
  return encoded;
}

// --- CashAddress encoder (minimal, bchtest P2PKH) ---
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x98f2bc8e61n, 0x79b76d99e2n, 0xf33e5fb3c4n, 0xae2eabe2a8n];

function polymod(values) {
  let chk = 1n;
  for (const value of values) {
    const top = chk >> 35n;
    chk = ((chk & 0x07ffffffffn) << 5n) ^ BigInt(value);
    for (let i = 0; i < 4; i++) {
      if ((top >> BigInt(i)) & 1n) chk ^= GENERATOR[i];
    }
  }
  return Number(chk ^ 1n);
}

function expandPrefix(prefix) {
  const result = [];
  for (let i = 0; i < prefix.length; i++) {
    result.push(prefix.charCodeAt(i) & 0x1f);
  }
  result.push(0);
  return result;
}

function convertBits(data, fromBits, toBits, pad) {
  let acc = 0;
  let bits = 0;
  const ret = [];
  const maxv = (1 << toBits) - 1;
  for (const value of data) {
    if (value < 0 || (value >> fromBits) !== 0) return null;
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits) ret.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || (acc << (toBits - bits)) & maxv) {
    return null;
  }
  return ret;
}

function encodeCashAddressBch(prefix, type, payload) {
  const versionByte = type === 'p2sh' ? 0x08 : 0x00;
  const payloadWithVersion = Buffer.concat([Buffer.from([versionByte]), payload]);
  const data5 = convertBits([...payloadWithVersion], 8, 5, true);
  const checksumInput = expandPrefix(prefix).concat(data5);
  const polymodValue = polymod(checksumInput);
  const checksum = [];
  for (let i = 0; i < 8; i++) {
    checksum.push((polymodValue >> (5 * (7 - i))) & 0x1f);
  }
  const combined = data5.concat(checksum);
  let encoded = prefix + ':';
  for (const value of combined) {
    encoded += CHARSET[value];
  }
  return encoded;
}

// --- Main ---

const ec = crypto.createECDH('secp256k1');
ec.generateKeys();
const privKeyBytes = ec.getPrivateKey(); // 32 bytes
const pubKeyUncompressed = ec.getPublicKey(); // 65 bytes, 0x04 prefix
const x = pubKeyUncompressed.subarray(1, 33);
const y = pubKeyUncompressed.subarray(33, 65);
const prefixByte = (y[y.length - 1] & 1) === 0 ? 0x02 : 0x03;
const pubKeyCompressed = Buffer.concat([Buffer.from([prefixByte]), x]);

const privKeyHex = privKeyBytes.toString('hex');
const pubKeyHex = pubKeyCompressed.toString('hex');
const pkh = hash160(pubKeyCompressed);
const pkhHex = pkh.toString('hex');
const address = encodeCashAddressBch('bchtest', 'p2pkh', pkh);
const lockingBytecodeHex = '76a914' + pkhHex + '88ac';
const wif = encodeWifTestnet(privKeyBytes);

console.log('=== Relayer Key ===\n');
console.log('RELAYER_PRIVATE_KEY_HEX=' + privKeyHex);
console.log('WIF=' + wif);
console.log('Public key hex=' + pubKeyHex);
console.log('bchtest address=' + address);
console.log('Locking bytecode=' + lockingBytecodeHex);
console.log('\nNext steps:');
console.log('1. Put RELAYER_PRIVATE_KEY_HEX in backend/.env');
console.log('2. Fund the bchtest: address above with chipnet BCH from a faucet');
console.log('   (e.g. https://chipnet.imaginary.cash/faucet)');
console.log('3. If you also want to use this as the treasury, put the locking');
console.log('   bytecode in TREASURY_LOCKING_BYTECODE and the address in');
console.log('   TREASURY_CHIPNET_ADDRESS too.');