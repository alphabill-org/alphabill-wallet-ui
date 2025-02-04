import { FungibleToken } from '@alphabill/alphabill-js-sdk/lib/tokens/FungibleToken';
import { UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { IFungibleTokenInfo } from './fungible/IFungibleTokenInfo';

export interface IFungibleTokenContext {
  readonly fungible: UseQueryResult<IFungibleTokenInfo<FungibleToken>[]>;
}

export const FungibleTokenContext = createContext<IFungibleTokenContext | null>(null);

export function useFungibleTokens(): IFungibleTokenContext {
  const context = useContext(FungibleTokenContext);
  if (!context) {
    throw new Error('Invalid fungible token context');
  }

  return context;
}
