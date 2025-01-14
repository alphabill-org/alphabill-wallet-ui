import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeed } from "@scure/bip39";
import { createContext, PropsWithChildren, useCallback, useContext } from "react";

const VAULT_LOCAL_STORAGE_KEY = "alphabill_vault";

interface IKey {
  alias: string;
  index: number;
}

interface IVaultContext {
  createVault(mnemonic: string, password: string, initialKey: IKey): Promise<void>;

  deriveKey(mnemonic: string, index: number): Promise<HDKey>;
}

const VaultContext = createContext<IVaultContext | null>(null);
const encoder = new TextEncoder();

export function useVault() {
  const context = useContext(VaultContext);

  if (!context) {
    throw new Error("Invalid vault context.");
  }

  return context;
}

export function VaultProvider({ children }: PropsWithChildren<object>) {
  const calculateKeyIV = useCallback(async (password: string, salt: Uint8Array) => {
    const digest = await crypto.subtle.digest("SHA-256", new Uint8Array([...encoder.encode(password), ...salt]));
    return digest.slice(0, 16);
  }, []);

  const createEncryptionKey = useCallback(async (password: string, salt: Uint8Array) => {
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

  const createVault = useCallback(async (mnemonic: string, password: string, initialKey: IKey) => {
    const salt = new Uint8Array(32);
    crypto.getRandomValues(salt);
    const { key, iv } = await createEncryptionKey(password, salt);

    const vault = new Uint8Array(
      await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
        },
        key,
        encoder.encode(
          JSON.stringify({
            mnemonic,
            keys: [initialKey],
          }),
        ),
      ),
    );

    // Store salt and vault
    localStorage.setItem(
      VAULT_LOCAL_STORAGE_KEY,
      JSON.stringify({
        vault: Base16Converter.encode(vault),
        salt: Base16Converter.encode(salt),
        keys: [],
      }),
    );
  }, []);

  const deriveKey = useCallback(async (mnemonic: string, index: number) => {
    const seed = await mnemonicToSeed(mnemonic);
    const masterKey = HDKey.fromMasterSeed(seed);
    return masterKey.derive(`m/44'/634'/${index}'/0/0`);
  }, []);

  return <VaultContext.Provider value={{ createVault, deriveKey }}>{children}</VaultContext.Provider>;
}
