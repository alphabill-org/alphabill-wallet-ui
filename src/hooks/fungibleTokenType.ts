import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { FungibleTokenType } from '@alphabill/alphabill-js-sdk/lib/tokens/FungibleTokenType';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAlphabill } from './alphabillContext';
import { useFungibleTokens } from './fungibleToken';
import { fetchUnits } from './units/fetchUnits';
import { createFetchTypeByIdQueryKey, createFetchUnitTypesQueryKey, QUERY_KEYS } from '../utils/unitsQueryKeys';

export function useFungibleTokenTypes(ownerId: Uint8Array | null): UseQueryResult<Map<string, FungibleTokenType>> {
  const queryClient = useQueryClient();
  const alphabill = useAlphabill();
  const units = useFungibleTokens(ownerId);

  const serializedOwnerId = useMemo(() => (ownerId ? Base16Converter.encode(ownerId) : null), [ownerId]);

  const tokenTypes = useMemo(() => {
    if (!units.data) {
      return [];
    }

    const result: IUnitId[] = [];
    for (const unit of units.data.values()) {
      result.push(unit.typeId);
    }

    return result;
  }, [units.data]);

  return useQuery<Map<string, FungibleTokenType>>({
    queryFn: async () => {
      if (!alphabill || !ownerId) {
        return Promise.resolve(new Map());
      }

      const iterator = fetchUnits(
        tokenTypes,
        (unitId: IUnitId) => alphabill.tokenClient.getUnit(unitId, false, FungibleTokenType),
        queryClient,
        createFetchTypeByIdQueryKey(QUERY_KEYS.FUNGIBLE, serializedOwnerId, alphabill.network.id)
      );
      const result = new Map<string, FungibleTokenType>();
      for await (const unit of iterator) {
        result.set(unit.unitId.toString(), unit);
      }

      return result;
    },
    queryKey: createFetchUnitTypesQueryKey(QUERY_KEYS.FUNGIBLE, serializedOwnerId, tokenTypes, alphabill?.network.id),
  });
}
