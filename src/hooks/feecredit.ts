import { FeeCreditRecord } from '@alphabill/alphabill-js-sdk/lib/fees/FeeCreditRecord';
import { UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

export interface IFeeCreditContext {
  readonly moneyFeeCredits: UseQueryResult<FeeCreditRecord[]>;
  readonly tokenFeeCredits: UseQueryResult<FeeCreditRecord[]>;
  resetFeeCredits(): Promise<void>;
}

export const FeeCreditContext = createContext<IFeeCreditContext | null>(null);

export function useFeeCredits(): IFeeCreditContext {
  const context = useContext(FeeCreditContext);
  if (!context) {
    throw new Error('Invalid fee credit context');
  }

  return context;
}
