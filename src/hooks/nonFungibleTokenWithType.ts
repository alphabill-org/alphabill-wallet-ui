import { Base64Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base64Converter';
import { useMemo } from 'react';

import { useNonFungibleTokens } from './nonFungibleToken';
import { useNonFungibleTokenTypes } from './nonFungibleTokenType';
import { INonFungibleTokenInfo } from './tokens/INonFungibleTokenInfo';
import { QueryResult } from '../utils/queryResult';

export function useNonFungibleTokensWithType(
  ownerId: Uint8Array | null,
): QueryResult<Map<string, INonFungibleTokenInfo> | null> {
  const units = useNonFungibleTokens(ownerId);
  const types = useNonFungibleTokenTypes(ownerId);

  const data = useMemo((): Map<string, INonFungibleTokenInfo> | null => {
    if (!units.data || !types.data) {
      return null;
    }

    const result = new Map<string, INonFungibleTokenInfo>();
    for (const unit of units.data.values()) {
      const type = types.data.get(unit.typeId.toString());
      if (!type) {
        // TODO: Do something with tokens which are missing type
        continue;
      }
      result.set(unit.unitId.toString(), {
        counter: unit.counter,
        icon: type.icon ? { data: Base64Converter.encode(type.icon.data), type: type.icon.type } : null,
        symbol: type.symbol,
        typeId: unit.typeId,
        unitId: unit.unitId,
      });
    }

    return result;
  }, [units.data, types.data]);

  if (units.isPending || types.isPending) {
    return { data: undefined, error: null, isError: false, isPending: true };
  }

  if (units.isError || types.isError) {
    const error = units.error || types.error;
    return { data: undefined, error: error as Error, isError: true, isPending: false };
  }

  return {
    data,
    error: null,
    isError: false,
    isPending: false,
  };
}
