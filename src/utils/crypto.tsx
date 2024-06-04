const encoder = new TextEncoder();

export function generateAesKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "AES-CBC",
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptData(): Promise<Uint8Array> {
  return new Uint8Array()
}