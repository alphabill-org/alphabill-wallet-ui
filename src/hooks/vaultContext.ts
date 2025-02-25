import type { ISigningService } from '@alphabill/alphabill-js-sdk/lib/signing/ISigningService';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { HDKey } from '@scure/bip32';
import { createContext, useContext } from 'react';

export interface IVaultKey {
  readonly alias: string;
  readonly index: number;
}

export interface IKeyInfo extends IVaultKey {
  readonly publicKey: {
    readonly hex: string;
    readonly key: Uint8Array;
  };
}

export interface IPublicKeyLocalStorage extends IVaultKey {
  readonly key: string;
}

export interface IVaultLocalStorage {
  readonly vault: string;
  readonly salt: string;
}

export interface IVault {
  readonly mnemonic: string;
  readonly keys: IVaultKey[];
}

export interface IVaultContext {
  readonly keys: IKeyInfo[];
  readonly selectedKey: IKeyInfo | null;

  selectKey(index: number): void;

  createVault(mnemonic: string, password: string, keys: IVaultKey[]): Promise<void>;

  addKey(alias: string, password: string): Promise<boolean>;

  deriveKey(mnemonic: string, index: number): Promise<HDKey>;

  unlock(password: string): Promise<boolean>;

  lock(): void;

  getSigningService(password: string, index: number): Promise<ISigningService>;
}

export const VaultContext = createContext<IVaultContext | null>(null);

export function parseKeyInfo(input: unknown): IKeyInfo[] {
  if (!Array.isArray(input)) {
    throw new Error('Invalid key array');
  }

  const data: unknown[] = input;

  const keys: IKeyInfo[] = [];
  for (const key of data) {
    if (
      !(
        typeof key === 'object' &&
        key !== null &&
        'alias' in key &&
        typeof key.alias === 'string' &&
        'index' in key &&
        Number.isSafeInteger(key.index) &&
        'key' in key &&
        typeof key.key === 'string'
      )
    ) {
      throw new Error('Invalid key');
    }

    keys.push({
      alias: key.alias,
      index: Number(key.index),
      publicKey: {
        hex: key.key,
        key: Base16Converter.decode(key.key),
      },
    });
  }

  return keys;
}

export function useVault(): IVaultContext {
  const context = useContext(VaultContext);

  if (!context) {
    throw new Error('Invalid vault context.');
  }

  return context;
}
