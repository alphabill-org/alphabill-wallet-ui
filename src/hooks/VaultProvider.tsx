import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeed } from '@scure/bip39';
import { PropsWithChildren, ReactElement, useCallback, useState } from 'react';

import { VaultContext, IVaultKey, IVault, IVaultLocalStorage, IKeyInfo } from './vaultContext';

const VAULT_LOCAL_STORAGE_KEY = 'alphabill_vault';
const VAULT_KEYS_LOCAL_STORAGE_KEY = 'alphabill_vault_keys';
const VAULT_SELECTED_KEY_LOCAL_STORAGE_KEY = 'alphabill_vault_selected_key';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function VaultProvider({ children }: PropsWithChildren): ReactElement {
  const [keys, setKeys] = useState<IKeyInfo[]>(() => {
    const storageKeys = localStorage.getItem(VAULT_KEYS_LOCAL_STORAGE_KEY);
    if (!storageKeys) {
      return [];
    }

    try {
      const { keys } = JSON.parse(storageKeys) as { keys: IKeyInfo[] };
      return keys;
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [selectedKey, setSelectedKey] = useState<IKeyInfo | null>(() => {
    const selectedKey = localStorage.getItem(VAULT_SELECTED_KEY_LOCAL_STORAGE_KEY);
    if (selectedKey === null) {
      return null;
    }

    return keys.find((key) => key.index === Number(selectedKey)) ?? null;
  });

  const calculateKeyIV = useCallback(async (password: string, salt: Uint8Array) => {
    const digest = await crypto.subtle.digest('SHA-256', new Uint8Array([...textEncoder.encode(password), ...salt]));
    return digest.slice(0, 16);
  }, []);

  const createEncryptionKey = useCallback(async (password: string, salt: Uint8Array) => {
    const key = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, [
      'deriveBits',
      'deriveKey',
    ]);

    return {
      iv: await calculateKeyIV(password, salt),
      key: await crypto.subtle.deriveKey(
        {
          hash: 'SHA-256',
          iterations: 129531,
          name: 'PBKDF2',
          salt,
        },
        key,
        { length: 256, name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt'],
      ),
    };
  }, []);

  const createVault = useCallback(async (mnemonic: string, password: string, initialKey: IVaultKey) => {
    const salt = new Uint8Array(32);
    crypto.getRandomValues(salt);
    const { key, iv } = await createEncryptionKey(password, salt);

    const data: IVault = {
      keys: [initialKey],
      mnemonic,
    };

    const vault = new Uint8Array(
      await crypto.subtle.encrypt(
        {
          iv,
          name: 'AES-GCM',
        },
        key,
        textEncoder.encode(JSON.stringify(data)),
      ),
    );

    // Store salt and vault
    localStorage.setItem(
      VAULT_LOCAL_STORAGE_KEY,
      JSON.stringify({
        salt: Base16Converter.encode(salt),
        vault: Base16Converter.encode(vault),
      }),
    );
  }, []);

  const decryptVault = useCallback(
    async (password: string, salt: Uint8Array, encryptedVault: Uint8Array): Promise<IVault> => {
      const { key, iv } = await createEncryptionKey(password, salt);
      const vaultBytes = await crypto.subtle.decrypt(
        {
          iv,
          name: 'AES-GCM',
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
        console.error('Decryption failed', e);
        return false;
      }
    },
    [decryptVault, deriveKey, setKeys],
  );

  const selectKey = useCallback(
    (key: IKeyInfo) => {
      localStorage.setItem(VAULT_SELECTED_KEY_LOCAL_STORAGE_KEY, String(key.index));
      setSelectedKey(key);
    },
    [setSelectedKey],
  );

  return (
    <VaultContext.Provider value={{ createVault, deriveKey, keys, selectKey, selectedKey, unlock }}>
      {children}
    </VaultContext.Provider>
  );
}
