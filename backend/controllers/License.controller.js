import crypto from 'node:crypto';
import Application from '../models/Application.model.js';
import License from '../models/License.model.js';
import ActivityLog from '../models/ActivityLogs.model.js';
import {
  issueLicense,
  renewLicense as renewLicenseOnChain,
  revokeLicense as revokeLicenseOnChain,
  lookupToken,
  verifyTreasuryPayment,
  encodeCommitment,
  decodeCommitment,
  hash160,
  binToHex,
} from '../services/chipnet.service.js';
import { getLicenseType } from '../src/licenseTypes.js';

const serial = () => crypto.randomBytes(4).readUInt32LE(0);
const sha256Hex = (value) => crypto.createHash('sha256').update(value).digest('hex');
const nameHash = (name) => sha256Hex(String(name || '').trim().toLowerCase());

const LICENSE_CLASS_ID = { DRIVER: 1, PRC: 2, BUSINESS: 3 };

// ---------------------------------------------------------------------------
// Mint: admin clicks "Mint" on a paid, approved application.
// Builds an unsigned transaction for the admin's wallet to sign (no server-held
// admin key). Records the would-be license with status PENDING until the
// admin's wallet returns the signed txid.
// ---------------------------------------------------------------------------

export async function mintLicense(req, res) {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (application.status !== 'APPROVED' || application.paymentStatus !== 'PAID') {
      return res.status(409).json({ success: false, message: 'Only paid, approved applications can be minted.' });
    }
    if (await License.exists({ application: application._id })) {
      return res.status(409).json({ success: false, message: 'This application has already been minted.' });
    }

    const type = getLicenseType(application.licenseType);
    if (!type) return res.status(400).json({ success: false, message: `License type "${application.licenseType}" is not configured.` });

    const payerAddress = application.payment?.payerAddress || '';
    if (!payerAddress) {
      return res.status(400).json({ success: false, message: 'Payer address could not be determined.' });
    }

    const holderPkh = binToHex(hash160(payerAddress));
    const hashedName = nameHash(application.fullName);

    const serialNum = serial();
    const expiryBlock = type.termLengthBlocks;
    const commitmentHex = encodeCommitment({
      serial: serialNum,
      holderPkhHex: holderPkh,
      expiryBlock,
      classId: LICENSE_CLASS_ID[application.licenseType] || 1,
      flags: 0,
      nameTagHex: hashedName.slice(0, 20),
    });

    // Build the unsigned tx for the admin's wallet to sign.
    const result = await issueLicense({ licenseType: application.licenseType, commitmentHex });

    const licenseNumber = `PP-${serialNum.toString(16).padStart(8, '0').toUpperCase()}`;
    const license = await License.create({
      licenseNumber,
      owner: application.applicant,
      application: application._id,
      holderPaymentAddress: payerAddress,
      holderPkh,
      holderName: application.fullName,
      nameHash: hashedName,
      issuer: req.user._id,
      licenseType: application.licenseType,
      classId: LICENSE_CLASS_ID[application.licenseType] || 1,
      status: 'PENDING',
      issueDate: new Date(),
      expiryBlock,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      category: result.category,
      commitment: result.commitment,
      serial: serialNum,
      vaultAddress: result.vaultAddress,
      blockchainTxId: '',
    });

    res.status(201).json({
      success: true,
      message: 'Unsigned issuance transaction built. Admin wallet must sign and broadcast.',
      license,
      unsignedTransactionHex: result.unsignedTransactionHex,
      verifyUrl: `/verify/${license.category}/${license.licenseNumber}`,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// Admin's wallet returns the signed txid after signing the unsigned tx above.
export async function confirmMint(req, res) {
  try {
    const { licenseNumber } = req.params;
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ success: false, message: 'transactionId is required.' });

    const license = await License.findOne({ licenseNumber, status: 'PENDING' });
    if (!license) return res.status(404).json({ success: false, message: 'No pending mint for this license number.' });

    license.blockchainTxId = transactionId;
    license.status = 'ACTIVE';
    await license.save();

    const application = await Application.findById(license.application);
    if (application) {
      application.status = 'MINTED';
      await application.save();
    }

    await ActivityLog.create({
      user: req.user._id,
      license: license._id,
      action: 'ISSUED',
      transactionHash: transactionId,
    });

    res.json({ success: true, message: 'License mint confirmed on Chipnet.', license });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// ---------------------------------------------------------------------------
// Renew: public, permissionless. Relayer pays the BCH fee.
// ---------------------------------------------------------------------------

export async function renewLicense(req, res) {
  try {
    const license = await License.findOne({ licenseNumber: req.params.licenseNumber });
    if (!license) return res.status(404).json({ success: false, message: 'License not found.' });
    if (license.status === 'REVOKED') {
      return res.status(409).json({ success: false, message: 'A revoked license cannot be renewed.' });
    }

    const type = getLicenseType(license.licenseType);
    if (!type) return res.status(400).json({ success: false, message: 'License type no longer configured.' });

    const payment = await verifyTreasuryPayment(
      req.body.transactionId,
      type.renewalFeeSats,
      process.env.TREASURY_CHIPNET_ADDRESS
    );

    const chain = await renewLicenseOnChain({
      licenseType: license.licenseType,
      commitmentHex: license.commitment,
    });

    license.commitment = chain.commitment;
    license.expiryBlock = chain.expiryBlock;
    license.blockchainTxId = chain.transactionId;
    license.status = 'ACTIVE';
    await license.save();

    await ActivityLog.create({
      license: license._id,
      action: 'RENEWED',
      transactionHash: chain.transactionId,
    });

    res.json({ success: true, message: 'License renewed on Chipnet.', license });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// ---------------------------------------------------------------------------
// Revoke: admin-signed burn. Returns an unsigned tx for the admin's wallet.
// ---------------------------------------------------------------------------

export async function revokeLicense(req, res) {
  try {
    const license = await License.findOne({ licenseNumber: req.params.licenseNumber, status: 'ACTIVE' });
    if (!license) return res.status(404).json({ success: false, message: 'An active license was not found.' });

    const result = await revokeLicenseOnChain({
      licenseType: license.licenseType,
      commitmentHex: license.commitment,
    });

    // Mark as REVOKED only after the admin's wallet actually broadcasts.
    // For now, return the unsigned tx; the admin confirms via confirmRevoke.
    res.json({
      success: true,
      message: 'Unsigned revocation transaction built. Admin wallet must sign and broadcast.',
      license,
      unsignedTransactionHex: result.unsignedTransactionHex,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function confirmRevoke(req, res) {
  try {
    const { licenseNumber } = req.params;
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ success: false, message: 'transactionId is required.' });

    const license = await License.findOne({ licenseNumber });
    if (!license) return res.status(404).json({ success: false, message: 'License not found.' });

    license.status = 'REVOKED';
    license.blockchainTxId = transactionId;
    await license.save();

    await ActivityLog.create({
      user: req.user._id,
      license: license._id,
      action: 'REVOKED',
      transactionHash: transactionId,
    });

    res.json({ success: true, message: 'License revoked on Chipnet.', license });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// ---------------------------------------------------------------------------
// Verify: public, queries the chain — not the database.
// ---------------------------------------------------------------------------

export async function verifyLicense(req, res) {
  try {
    const license = await License.findOne({ licenseNumber: req.params.licenseNumber });
    if (!license || license.status === 'REVOKED') {
      return res.status(404).json({ valid: false, status: 'NOT_VALID', reason: 'No active on-chain token exists for this serial.' });
    }

    const onChain = await lookupToken(license.licenseType, license.commitment);

    let nameMatches = true;
    if (req.query.name) {
      nameMatches = nameHash(req.query.name) === license.nameHash;
    }

    const decoded = decodeCommitment(license.commitment);

    await ActivityLog.create({ license: license._id, action: 'VERIFIED' });

    res.json({
      valid: Boolean(onChain) && nameMatches,
      status: !onChain ? 'NOT_VALID' : (nameMatches ? 'VALID' : 'NAME_MISMATCH'),
      serial: license.licenseNumber,
      category: license.category,
      licenseType: license.licenseType,
      expiryBlock: decoded.expiryBlock,
      expiryDate: license.expiryDate,
      onChain,
    });
  } catch (error) {
    res.status(400).json({ valid: false, status: 'NOT_VALID', message: error.message });
  }
}

// ---------------------------------------------------------------------------
// List / get
// ---------------------------------------------------------------------------

export async function listLicenses(req, res) {
  try {
    const filter = req.user?.role === 'ADMIN' ? {} : { owner: req.user?._id };
    const licenses = await License.find(filter).populate('owner', 'email walletAddress').sort({ createdAt: -1 });
    res.json({ success: true, licenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getLicense(req, res) {
  try {
    const license = await License.findOne({ licenseNumber: req.params.licenseNumber }).populate('owner', 'email walletAddress');
    if (!license) return res.status(404).json({ success: false, message: 'License not found.' });
    res.json({ success: true, license });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}