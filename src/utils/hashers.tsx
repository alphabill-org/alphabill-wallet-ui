import { sha256 } from "@noble/hashes/sha256";

export function publicKeyHash(key: string): string {
  if (!key) {
    return "";
  }
  const checkedKey = key?.startsWith("0x") ? key.substring(2) : key;
  const keyHash = Buffer.from(checkedKey, "hex");
  const hash = Buffer.from(sha256(keyHash));
  return "0x" + hash.toString("hex");
}
