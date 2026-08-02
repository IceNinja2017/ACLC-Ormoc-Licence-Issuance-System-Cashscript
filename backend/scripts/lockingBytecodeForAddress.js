// Derive the P2PKH locking bytecode for a CashAddress.
// Usage: node scripts/lockingBytecodeForAddress.js <bchtest:address>
//
// Example:
//   node scripts/lockingBytecodeForAddress.js bchtest:qzfuml7eqzap482wz5fhw09nmqse36q4vc9hf3a5q3
//
// This is for setting TREASURY_LOCKING_BYTECODE when the treasury is the same
// wallet as the admin (or any P2PKH address).

import { decodeCashAddress } from '@bitauth/libauth';

const address = process.argv[2];
if (!address) {
  console.error('Usage: node scripts/lockingBytecodeForAddress.js <bchtest:address>');
  process.exit(1);
}

const decoded = decodeCashAddress(address);
if (typeof decoded === 'string') {
  console.error('Invalid CashAddress:', decoded);
  process.exit(1);
}

if (decoded.type !== 'p2pkh') {
  console.error(`Address is ${decoded.type}, not p2pkh. The treasury locking bytecode format 76a914...88ac only fits P2PKH addresses.`);
  process.exit(1);
}

const pkhHex = Buffer.from(decoded.payload).toString('hex');
const lockingBytecodeHex = '76a914' + pkhHex + '88ac';

console.log('Address:           ' + address);
console.log('Payload (PKH) hex: ' + pkhHex);
console.log('Locking bytecode:  ' + lockingBytecodeHex);
console.log('\nPut this in backend/.env:');
console.log('TREASURY_LOCKING_BYTECODE=' + lockingBytecodeHex);
console.log('TREASURY_CHIPNET_ADDRESS=' + address);