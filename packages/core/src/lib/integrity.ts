import { HmacSHA384, enc } from 'crypto-js';

export function getSignature(request: string, key: string) {
  return HmacSHA384(request, key).toString(enc.Base64);
}

export function validateSignature(
  request: string,
  key: string,
  signature: string
) {
  return getSignature(request, key) === signature;
}
