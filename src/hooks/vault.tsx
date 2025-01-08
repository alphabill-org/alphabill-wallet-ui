import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import { HDKey } from "@scure/bip32";
import { mnemonicToEntropy, mnemonicToSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { createContext, PropsWithChildren, useCallback } from "react";

export interface IVaultContext {
  createVault(mnemonic: string, password: string): Promise<void>;
}

export const VaultContext = createContext<IVaultContext | null>(null);

const encoder = new TextEncoder();

export default function VaultProvider({ children }: PropsWithChildren<object>) {
  const calculateKeyIV = useCallback(async (password: string, salt: Uint8Array) => {
    const digest = await crypto.subtle.digest("SHA-256", new Uint8Array([...encoder.encode(password), ...salt]));
    return digest.slice(0, 16);
  }, []);

  const createKey = useCallback(async (password: string, salt: Uint8Array) => {
    const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
      "deriveBits",
      "deriveKey",
    ]);

    return {
      key: await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: 129531,
          hash: "SHA-256",
        },
        key,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      ),
      iv: await calculateKeyIV(password, salt),
    };
  }, []);

  const createVault = useCallback(async (mnemonic: string, password: string) => {
    const seed = await mnemonicToSeed(mnemonic);
    const masterKey = HDKey.fromMasterSeed(seed);

    const salt = new Uint8Array(32);
    crypto.getRandomValues(salt);
    const { key, iv } = await createKey(password, salt);

    const vault = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encoder.encode(
        JSON.stringify({
          entropy: Base16Converter.encode(mnemonicToEntropy(mnemonic, wordlist)),
        }),
      ),
    );
  }, []);

  return <VaultContext.Provider value={{ createVault }}>{children}</VaultContext.Provider>;
}
