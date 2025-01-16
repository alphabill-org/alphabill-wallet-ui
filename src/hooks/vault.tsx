import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeed } from "@scure/bip39";
import { createContext, PropsWithChildren, ReactElement, useCallback, useContext, useState } from "react";

const VAULT_LOCAL_STORAGE_KEY = "alphabill_vault";
const VAULT_KEYS_LOCAL_STORAGE_KEY = "alphabill_vault_keys";

interface IVaultKey {
  readonly alias: string;
  readonly index: number;
}

interface IKeyInfo extends IVaultKey {
  publicKey: string;
}

interface IVaultLocalStorage {
  readonly vault: string;
  readonly salt: string;
}

interface IVault {
  readonly mnemonic: string;
  readonly keys: IVaultKey[];
}

interface IVaultContext {
  readonly keys: IVaultKey[];
  createVault(mnemonic: string, password: string, initialKey: IVaultKey): Promise<void>;
  deriveKey(mnemonic: string, index: number): Promise<HDKey>;
  unlock(password: string): Promise<boolean>;
}

const VaultContext = createContext<IVaultContext | null>(null);
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function useVault(): IVaultContext {
  const context = useContext(VaultContext);

  if (!context) {
    throw new Error("Invalid vault context.");
  }

  return context;
}

export function VaultProvider({ children }: PropsWithChildren<object>): ReactElement {
  const [keys, setKeys] = useState<IKeyInfo[]>(() => {
    const storageKeys = localStorage.getItem(VAULT_KEYS_LOCAL_STORAGE_KEY);
    if (!storageKeys) {
      return [];
    }

    try {
      return JSON.parse(storageKeys);
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const calculateKeyIV = useCallback(async (password: string, salt: Uint8Array) => {
    const digest = await crypto.subtle.digest("SHA-256", new Uint8Array([...textEncoder.encode(password), ...salt]));
    return digest.slice(0, 16);
  }, []);

  const createEncryptionKey = useCallback(async (password: string, salt: Uint8Array) => {
    const key = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, [
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

  const createVault = useCallback(async (mnemonic: string, password: string, initialKey: IVaultKey) => {
    const salt = new Uint8Array(32);
    crypto.getRandomValues(salt);
    const { key, iv } = await createEncryptionKey(password, salt);

    const data: IVault = {
      mnemonic,
      keys: [initialKey],
    };

    const vault = new Uint8Array(
      await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
        },
        key,
        textEncoder.encode(JSON.stringify(data)),
      ),
    );

    // Store salt and vault
    localStorage.setItem(
      VAULT_LOCAL_STORAGE_KEY,
      JSON.stringify({
        vault: Base16Converter.encode(vault),
        salt: Base16Converter.encode(salt),
      }),
    );
  }, []);

  const decryptVault = useCallback(
    async (password: string, salt: Uint8Array, encryptedVault: Uint8Array): Promise<IVault> => {
      const { key, iv } = await createEncryptionKey(password, salt);
      const vaultBytes = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
        },
        key,
        encryptedVault,
      );

      const vaultJson = textDecoder.decode(vaultBytes);
      return JSON.parse(vaultJson);
    },
    [],
  );

  const deriveKey = useCallback(async (mnemonic: string, index: number) => {
    const seed = await mnemonicToSeed(mnemonic);
    const masterKey = HDKey.fromMasterSeed(seed);
    return masterKey.derive(`m/44'/634'/${index}'/0/0`);
  }, []);

  const unlock = useCallback(
    async (password: string): Promise<boolean> => {
      const storageVaultJson = localStorage.getItem(VAULT_LOCAL_STORAGE_KEY);
      if (!storageVaultJson) {
        return false;
      }

      const storageVault = JSON.parse(storageVaultJson) as IVaultLocalStorage;
      try {
        const vault = await decryptVault(
          password,
          Base16Converter.decode(storageVault.salt),
          Base16Converter.decode(storageVault.vault),
        );

        const publicKeys: IKeyInfo[] = [];

        for (const key of vault.keys) {
          const derivedKey = await deriveKey(vault.mnemonic, key.index);
          if (!derivedKey.publicKey) {
            throw new Error(`Could not derive public key for '${key.alias}'`);
          }

          publicKeys.push({
            alias: key.alias,
            index: key.index,
            publicKey: Base16Converter.encode(derivedKey.publicKey),
          });
        }

        setKeys(publicKeys);
        localStorage.setItem(
          VAULT_KEYS_LOCAL_STORAGE_KEY,
          JSON.stringify({
            keys: publicKeys,
          }),
        );

        return true;
      } catch (e) {
        console.error("Decryption failed", e);
        return false;
      }
    },
    [decryptVault, deriveKey, setKeys],
  );

  return <VaultContext.Provider value={{ createVault, deriveKey, unlock, keys }}>{children}</VaultContext.Provider>;
}
