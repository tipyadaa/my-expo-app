// Lightweight reversible obfuscation for account numbers without extra deps.
// It XORs each char with the key and encodes the result as hex.

function toHex(n: number): string {
  return n.toString(16).padStart(2, '0');
}

export function xorHex(input: string, key: string): string {
  if (!key) key = 'SURE_SURE_KEY';
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    out += toHex(code);
  }
  return out;
}

/**
 * Encrypt account number to hex string using simple XOR with a per-user secret.
 * NOTE: This is obfuscation, not cryptographically strong encryption.
 */
export function encryptAccountNo(accountNo: string, secret?: string): string {
  const key = (secret && String(secret)) || 'SURE_SURE_KEY';
  return xorHex(accountNo, key);
}

