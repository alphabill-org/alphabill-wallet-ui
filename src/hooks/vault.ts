import type { ISigningService } from '@alphabill/alphabill-js-sdk/lib/signing/ISigningService';
import { HDKey } from '@scure/bip32';
import { createContext, useContext } from 'react';

export interface IVaultKey {
  readonly alias: string;
  readonly index: number;
}

export interface IKeyInfo extends IVaultKey {
  publicKey: string;
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

  selectKey(key: IKeyInfo): void;

  createVault(mnemonic: string, password: string, initialKey: IVaultKey): Promise<void>;

  deriveKey(mnemonic: string, index: number): Promise<HDKey>;

  unlock(password: string): Promise<boolean>;

  lock(): void;

  getSigningService(): Promise<ISigningService>;
}

export const Vault = createContext<IVaultContext | null>(null);

export function useVault(): IVaultContext {
  const context = useContext(Vault);

  if (!context) {
    throw new Error('Invalid vault context.');
  }

  return context;
}
