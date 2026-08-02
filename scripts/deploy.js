// One-time per-type deployment helper.
// Usage: node scripts/deploy.js <prc|business|driver>
//
// This script:
// 1. Mints a new CashToken category (the genesis NFT for the issuer authority).
// 2. Deploys the Issuer covenant with ADMIN_PUBLIC_KEY_HEX.
// 3. Deploys the LicenseVault covenant with the global constructor args.
// 4. Sends the minting-capability NFT to the Issuer covenant address.
// 5. Prints the <PREFIX>_* env vars to add to backend/.env.
//
// Requires: ADMIN_WIF (the admin's wallet, with chipnet funds) for the one-time
// deployment. After deployment, the admin wallet signs issue/revoke live; the
// server never holds ADMIN_WIF.

import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
dotenv.config();

const type = process.argv[2]?.toLowerCase();
if (!type || !['prc', 'business', 'driver'].includes(type)) {
  console.error('Usage: node scripts/deploy.js <prc|business|driver>');
  process.exit(1);
}

const PREFIX = type.toUpperCase();
const adminWif = process.env.ADMIN_WIF;
if (!adminWif) {
  console.error('ADMIN_WIF must be set in backend/.env to deploy.');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Contract, ElectrumNetworkProvider, Network, SignatureTemplate } = await import('cashscript');
const { binToHex, hexToBin } = await import('@bitauth/libauth');
const { hash160 } = await import('@cashscript/utils');

const issuerArtifact = JSON.parse(
  await readFile(resolve(__dirname, '../contracts/artifacts/Issuer.json'), 'utf8')
);
const vaultArtifact = JSON.parse(
  await readFile(resolve(__dirname, '../contracts/artifacts/LicenseVault.json'), 'utf8')
);

const network = Network.CHIPNET;
const provider = new ElectrumNetworkProvider(network);

const adminSig = new SignatureTemplate(adminWif);
const adminPk = adminSig.publicKey;
console.log('Admin public key:', binToHex(adminPk));

// Derive the admin P2PKH address for funding
const adminPkh = hash160(adminPk);
const { encodeCashAddress } = await import('@bitauth/libauth');
const adminAddress = encodeCashAddress({ prefix: 'bchtest', type: 'p2pkh', payload: adminPkh });
console.log('Admin address:', adminAddress);

// 1. Deploy the Issuer covenant
const issuer = new Contract({
  artifact: issuerArtifact,
  arguments: [adminPk],
  provider,
  addressType: 'p2sh20',
});
console.log('Issuer covenant address:', issuer.address);

// 2. Deploy the LicenseVault covenant
const treasuryLockingBytecode = hexToBin(process.env.TREASURY_LOCKING_BYTECODE || '');
if (!process.env.TREASURY_LOCKING_BYTECODE) {
  console.error('TREASURY_LOCKING_BYTECODE must be set.');
  process.exit(1);
}
const renewalFeeSats = Number(process.env[`${PREFIX}_RENEWAL_FEE_SATS`] || 1000);
const termLengthBlocks = Number(process.env[`${PREFIX}_TERM_LENGTH_BLOCKS`] || 4320);

const vault = new Contract({
  artifact: vaultArtifact,
  arguments: [adminPk, treasuryLockingBytecode, renewalFeeSats, termLengthBlocks],
  provider,
  addressType: 'p2sh20',
});
console.log('LicenseVault covenant address:', vault.address);

// 3. Look up the admin's UTXOs to fund the category-minting transaction
const adminUtxos = await provider.getUtxos(adminAddress);
if (!adminUtxos.length) {
  console.error(`Admin wallet ${adminAddress} has no UTXOs. Fund it with chipnet BCH first.`);
  process.exit(1);
}
console.log(`Admin has ${adminUtxos.length} UTXOs.`);

// 4. Mint the genesis NFT category and send the minting NFT to the Issuer.
// This is a plain BCH tx with token minting. Use cashscript's TransactionBuilder.
// The genesis category ID = the funding txid (BCH rule for minting categories).
console.log('Minting authority NFT and sending to Issuer covenant...');

// Build a simple mint transaction: input from admin, output 0 = minting NFT to issuer
// cashscript's TransactionBuilder handles this via .fromP2PKH + token outputs.
const tx = new (await import('cashscript')).TransactionBuilder({ provider })
  .addInputs(adminUtxos.map((u) => ({ ...u, unlockingBytecode: undefined })))
  .addOutputs([
    {
      to: issuer.address,
      amount: 1000n,
      token: {
        category: '', // minting
        amount: 0n,
        nft: { capability: 'minting', commitment: 'a1' },
      },
    },
  ])
  .sign();

const txid = tx.txid;
const categoryId = txid; // genesis category ID = txid for minting txs
console.log('Mint transaction txid (genesis category ID):', categoryId);

// 5. Print the env vars to add
const envLines = [
  `\n# Deployed by scripts/deploy.js ${type} on ${new Date().toISOString()}`,
  `${PREFIX}_ISSUER_CATEGORY_ID=${categoryId}`,
  `${PREFIX}_ISSUER_TOKEN_ADDRESS=${issuer.address}`,
  `${PREFIX}_LICENSE_VAULT_ADDRESS=${vault.address}`,
  `${PREFIX}_LICENSE_VAULT_TOKEN_ADDRESS=${vault.address}`,
  `ADMIN_PUBLIC_KEY_HEX=${binToHex(adminPk)}`,
];

console.log('\n--- Add these to backend/.env: ---');
console.log(envLines.join('\n'));

const envPath = resolve(__dirname, '../backend/.env');
await appendFile(envPath, envLines.join('\n') + '\n');
console.log(`\nAlso appended to ${envPath}`);