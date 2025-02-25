import { FungibleToken } from '@alphabill/alphabill-js-sdk/lib/tokens/FungibleToken';
import { useMemo } from 'react';

import { useFungibleTokens } from './fungibleToken';
import { useFungibleTokenTypes } from './fungibleTokenType';
import { IFungibleTokenInfo } from './tokens/IFungibleTokenInfo';
import { QueryResult } from '../utils/queryResult';

export function useAggregatedFungibleTokens(
  ownerId: Uint8Array | null,
): QueryResult<Map<string, IFungibleTokenInfo<FungibleToken>> | null> {
  const units = useFungibleTokens(ownerId);
  const types = useFungibleTokenTypes(ownerId);

  const data = useMemo((): Map<string, IFungibleTokenInfo<FungibleToken>> | null => {
    if (!units.data || !types.data) {
      return null;
    }

    const tokensByType = new Map<string, FungibleToken[]>();
    for (const unit of units.data.values()) {
      const typeId = unit.typeId.toString();
      const tokens = tokensByType.get(typeId) ?? [];
      if (tokens.length === 0) {
        tokensByType.set(typeId, tokens);
      }

      tokens.push(unit);
    }

    const result = new Map<string, IFungibleTokenInfo<FungibleToken>>();
    for (const [typeId, tokens] of tokensByType.entries()) {
      const type = types.data.get(typeId);
      if (!type) {
        // TODO: Do something with tokens which are missing type
        continue;
      }
      let typeIcon = null;
      if (type.icon) {
        typeIcon = { data: btoa(new TextDecoder().decode(type.icon.data)), type: type.icon.type };
      }
      result.set(typeId, {
        decimalPlaces: type.decimalPlaces,
        icon: typeIcon,
        id: typeId,
        name: type.name,
        total: tokens.reduce((previous, current) => previous + current.value, 0n),
        units: tokens,
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
