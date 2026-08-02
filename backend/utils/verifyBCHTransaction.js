export async function verifyBCHTransaction({
  transactionId,
  expectedAddress,
  expectedAmount,
}) {
  // TODO: Replace with real Chipnet verification

  return {
    valid: true,
    amount: expectedAmount,
    address: expectedAddress,
  };
}