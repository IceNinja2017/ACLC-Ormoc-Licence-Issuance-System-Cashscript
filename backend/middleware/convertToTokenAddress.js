import { encodeCashAddress, decodeCashAddress } from '@bitauth/libauth';

export async function convertToTokenAddress(userBchAddress) {
  const decoded = await decodeCashAddress(userBchAddress);
  
  if (typeof decoded === 'string') {
    throw new Error('Invalid BCH address');
  }

  // Swap the type to p2pkhWithTokens or p2shWithTokens
  const tokenAddressType = decoded.type === 'p2pkh' 
    ? 'p2pkhWithTokens' 
    : 'p2shWithTokens';

  return encodeCashAddress({
    prefix: decoded.prefix,
    type: tokenAddressType,
    payload: decoded.payload,
  });
}