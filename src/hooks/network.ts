import { createContext, useContext } from 'react';

export interface INetwork {
  readonly id: string;
  readonly alias: string;
  readonly moneyPartitionUrl: string;
  readonly tokenPartitionUrl: string;
}

export interface INetworkContext {
  networks: INetwork[];
  selectedNetwork: INetwork | null;
  setSelectedNetwork: (network: INetwork) => void;
  addNetwork: (network: Omit<INetwork, 'id'>) => void;
}

export const Network = createContext<INetworkContext | null>(null);

export function useNetwork(): INetworkContext {
  const context = useContext(Network);
  if (!context) {
    throw new Error('Invalid network context.');
  }

  return context;
}
