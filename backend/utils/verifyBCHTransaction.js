import { verifyTreasuryPayment } from "../services/chipnet.service.js";

export async function verifyBCHTransaction({ transactionId, expectedAddress, expectedAmount }) {
  const sats = Math.round(Number(expectedAmount) * 100000000);
  const result = await verifyTreasuryPayment(transactionId, sats);
  return {
    valid: true,
    amount: expectedAmount,
    address: expectedAddress,
    payerAddress: result.payerAddress,
  };
}