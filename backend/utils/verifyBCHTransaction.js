import axios from "axios";
import env from "dotenv";
env.config();

export async function verifyBCHTransaction({
  transactionId,
  expectedAddress,
  expectedAmount,
}) {

  const response = await axios.post(
    process.env.CHAINGRAPH_GRAPHQL_URL,
    {
      query: `
      query {
        transaction(hash: "${transactionId}") {
          outputs {
            value
            locking_bytecode
          }
        }
      }
      `
    }
  );


  const transaction =
    response.data.data.transaction;


  if (!transaction) {
    return false;
  }


  // BCH uses satoshis internally
  const expectedSatoshis =
    expectedAmount * 100000000;


  const paidAmount =
    transaction.outputs.reduce(
      (total, output) =>
        total + output.value,
      0
    );


  if (paidAmount < expectedSatoshis) {
    return false;
  }


  return true;
}