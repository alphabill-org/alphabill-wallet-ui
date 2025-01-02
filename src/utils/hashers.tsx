import { sha256 } from "@noble/hashes/sha256";

export const publicKeyHash = async (key: string, asHexString?: boolean) => {
  if (!key) return "";

  const checkedKey = key?.startsWith("0x") ? key.substring(2) : key;
  const keyHash = Buffer.from(checkedKey, "hex");
  const hash = Buffer.from(sha256(keyHash));

  if (asHexString) {
    return ("0x" + hash.toString("hex")) as string;
  }

  return hash as Uint8Array;
};
