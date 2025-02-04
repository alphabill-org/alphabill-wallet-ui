import { MoneyPartitionJsonRpcClient } from '@alphabill/alphabill-js-sdk/lib/json-rpc/MoneyPartitionJsonRpcClient';
import { TokenPartitionJsonRpcClient } from '@alphabill/alphabill-js-sdk/lib/json-rpc/TokenPartitionJsonRpcClient';
import { createContext, useContext } from 'react';

export interface IAlphabillContext {
  networkId: string;
  moneyClient: MoneyPartitionJsonRpcClient;
  tokenClient: TokenPartitionJsonRpcClient;
}

export const Alphabill = createContext<IAlphabillContext | null>(null);

export function useAlphabill(): IAlphabillContext | null {
  return useContext(Alphabill);
}
