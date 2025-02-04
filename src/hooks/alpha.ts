import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { IFungibleTokenInfo } from './fungible/IFungibleTokenInfo';

export interface IAlphaContext {
  readonly alpha: UseQueryResult<IFungibleTokenInfo<Bill>>;
}

export const AlphaContext = createContext<IAlphaContext | null>(null);

export function useAlphas(): IAlphaContext {
  const context = useContext(AlphaContext);
  if (!context) {
    throw new Error('Invalid alpha context');
  }

  return context;
}
