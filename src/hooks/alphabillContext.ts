import { MoneyPartitionJsonRpcClient } from '@alphabill/alphabill-js-sdk/lib/json-rpc/MoneyPartitionJsonRpcClient';
import { TokenPartitionJsonRpcClient } from '@alphabill/alphabill-js-sdk/lib/json-rpc/TokenPartitionJsonRpcClient';
import { createContext, useContext } from 'react';

import { INetwork } from './networkContext';

export interface IAlphabillContext {
  network: INetwork;
  moneyClient: MoneyPartitionJsonRpcClient;
  tokenClient: TokenPartitionJsonRpcClient;
}

export const AlphabillContext = createContext<IAlphabillContext | null>(null);

export function useAlphabill(): IAlphabillContext | null {
  return useContext(AlphabillContext);
}
