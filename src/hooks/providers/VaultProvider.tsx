import { DefaultSigningService } from '@alphabill/alphabill-js-sdk/lib/signing/DefaultSigningService';
import type { ISigningService } from '@alphabill/alphabill-js-sdk/lib/signing/ISigningService';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeed } from '@scure/bip39';
import { PropsWithChildren, ReactElement, useCallback, useMemo, useState } from 'react';

import {
  VaultContext,
  IVault,
  IVaultLocalStorage,
  IKeyInfo,
  IVaultKey,
  parseKeyInfo,
  IPublicKeyLocalStorage,
} from '../vaultContext';

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
      return parseKeyInfo(JSON.parse(storageKeys));
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(() => {
    const selectedKey = localStorage.getItem(VAULT_SELECTED_KEY_LOCAL_STORAGE_KEY);
    if (selectedKey === null) {
      return null;
    }

    return Number(selectedKey);
  });

  const calculateKeyIV = useCallback(async (password: string, salt: Uint8Array) => {
    const digest = await crypto.subtle.digest('SHA-256', new Uint8Array([...textEncoder.encode(password), ...salt]));
    return digest.slice(0, 16);
  }, []);

  const createEncryptionKey = useCallback(
    async (password: string, salt: Uint8Array) => {
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
    },
    [calculateKeyIV],
  );

  const createVault = useCallback(
    async (mnemonic: string, password: string, keys: IVaultKey[]) => {
      const salt = new Uint8Array(32);
      crypto.getRandomValues(salt);
      const { key, iv } = await createEncryptionKey(password, salt);

      const data: IVault = {
        keys,
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
    },
    [createEncryptionKey],
  );

  const addKey = useCallback(
    async (alias: string, password: string) => {
      const vault = await loadVault(password);
      if (!vault) {
        return false;
      }
      const lastIndex = vault.keys[keys.length - 1].index;
      await createVault(vault.mnemonic, password, [...keys, { alias, index: lastIndex + 1 }]);
      await unlock(password);
      return true;
    },
    [createVault, keys],
  );

  const deriveKey = useCallback(async (mnemonic: string, index: number) => {
    const seed = await mnemonicToSeed(mnemonic);
    const masterKey = HDKey.fromMasterSeed(seed);
    return masterKey.derive(`m/44'/634'/${index}'/0/0`);
  }, []);

  const decryptVault = useCallback(
    async (password: string, salt: Uint8Array, encryptedVault: Uint8Array): Promise<IVault> => {
      const { key, iv } = await createEncryptionKey(password, salt);

      try {
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
      } catch (e) {
        console.error(e);
        throw new Error('Could not decrypt vault.');
      }
    },
    [createEncryptionKey],
  );

  const loadVault = useCallback(
    async (password: string): Promise<IVault | null> => {
      const storageVaultJson = localStorage.getItem(VAULT_LOCAL_STORAGE_KEY);
      if (!storageVaultJson) {
        return null;
      }

      const storageVault = JSON.parse(storageVaultJson) as IVaultLocalStorage;
      return await decryptVault(
        password,
        Base16Converter.decode(storageVault.salt),
        Base16Converter.decode(storageVault.vault),
      );
    },
    [decryptVault],
  );

  const unlock = useCallback(
    async (password: string): Promise<boolean> => {
      try {
        const vault = await loadVault(password);
        if (!vault) {
          return false;
        }

        const publicKeys: IKeyInfo[] = [];

        for (const key of vault.keys) {
          const derivedKey = await deriveKey(vault.mnemonic, key.index);
          if (!derivedKey.publicKey) {
            throw new Error(`Could not derive public key for '${key.alias}'`);
          }

          publicKeys.push({
            alias: key.alias,
            index: key.index,
            publicKey: {
              hex: Base16Converter.encode(derivedKey.publicKey),
              key: derivedKey.publicKey,
            },
          });
        }

        setKeys(publicKeys);
        const localStorageKeys: IPublicKeyLocalStorage[] = publicKeys.map(({ alias, index, publicKey }) => ({
          alias,
          index,
          key: publicKey.hex,
        }));
        localStorage.setItem(VAULT_KEYS_LOCAL_STORAGE_KEY, JSON.stringify(localStorageKeys));

        return true;
      } catch (e) {
        console.error('Decryption failed.', e);
        return false;
      }
    },
    [decryptVault, deriveKey, loadVault, setKeys],
  );

  const lock = useCallback((): void => {
    setKeys([]);
    localStorage.removeItem(VAULT_KEYS_LOCAL_STORAGE_KEY);
  }, [setKeys]);

  const selectKey = useCallback(
    (index: number) => {
      localStorage.setItem(VAULT_SELECTED_KEY_LOCAL_STORAGE_KEY, String(index));
      setSelectedKeyIndex(index);
    },
    [setSelectedKeyIndex],
  );

  const getSigningService = useCallback(
    async (password: string, index: number): Promise<ISigningService> => {
      const vault = await loadVault(password);
      if (!vault) {
        throw new Error('Could not load vault');
      }

      const key = await deriveKey(vault.mnemonic, index);
      if (!key.privateKey) {
        throw new Error('Could not derive key');
      }

      return new DefaultSigningService(key.privateKey);
    },
    [loadVault, deriveKey],
  );

  const selectedKey = useMemo(() => {
    return keys.find((key) => key.index === selectedKeyIndex) ?? null;
  }, [keys, selectedKeyIndex]);

  return (
    <VaultContext.Provider
      value={{ addKey, createVault, deriveKey, getSigningService, keys, lock, selectKey, selectedKey, unlock }}
    >
      {children}
    </VaultContext.Provider>
  );
}
