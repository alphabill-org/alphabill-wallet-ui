import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { useMemo } from 'react';

import { ALPHA_DECIMAL_PLACES, ALPHA_ICON, ALPHA_KEY } from '../constants';
import { useAlphas } from './alpha';
import { IFungibleTokenInfo } from './fungible/IFungibleTokenInfo';
import { QueryResult } from '../utils/queryResult';

function createAlphaInfo(total: bigint, units: Bill[]): IFungibleTokenInfo<Bill> {
  return {
    decimalPlaces: ALPHA_DECIMAL_PLACES,
    icon: ALPHA_ICON,
    id: ALPHA_KEY,
    name: ALPHA_KEY,
    total,
    units,
  };
}

export function useAggregatedAlphas(ownerId: Uint8Array | null): QueryResult<IFungibleTokenInfo<Bill> | null> {
  const units = useAlphas(ownerId);

  const data = useMemo((): IFungibleTokenInfo<Bill> | null => {
    if (!units.data) {
      return null;
    }

    let total = 0n;
    const result: Bill[] = [];
    for (const unit of units.data.values()) {
      total += unit.value;
      result.push(unit);
    }

    return createAlphaInfo(total, result);
  }, [units.data]);

  if (units.isPending) {
    return { data: undefined, error: null, isError: false, isPending: true };
  }

  if (units.isError) {
    return { data: undefined, error: units.error, isError: true, isPending: false };
  }

  return {
    data,
    error: null,
    isError: false,
    isPending: false,
  };
}
