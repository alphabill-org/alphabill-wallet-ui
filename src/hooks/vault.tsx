import { ISigningService } from "@alphabill/alphabill-js-sdk/lib/signing/ISigningService";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeed } from "@scure/bip39";
import { createContext, PropsWithChildren, useCallback } from "react";

export interface IVaultContext {
  getSigningService(key: string): Promise<ISigningService>;
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
          masterKey: masterKey.toJSON(),
        }),
      ),
    );
  }, []);

  return <VaultContext.Provider value={null}>{children}</VaultContext.Provider>;
}
