import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { NonFungibleTokenType } from '@alphabill/alphabill-js-sdk/lib/tokens/NonFungibleTokenType';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAlphabill } from './alphabillContext';
import { useNonFungibleTokens } from './nonFungibleToken';
import { fetchUnits } from './units/fetchUnits';
import { createFetchTypeByIdQueryKey, createFetchUnitTypesQueryKey, QUERY_KEYS } from '../utils/unitsQueryKeys';

export function useNonFungibleTokenTypes(
  ownerId: Uint8Array | null,
): UseQueryResult<Map<string, NonFungibleTokenType> | null> {
  const queryClient = useQueryClient();
  const alphabill = useAlphabill();
  const units = useNonFungibleTokens(ownerId);

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

  return useQuery<Map<string, NonFungibleTokenType> | null>({
    queryFn: async () => {
      if (!alphabill || !ownerId) {
        return Promise.resolve(null);
      }

      const iterator = fetchUnits(
        tokenTypes,
        (unitId: IUnitId) => alphabill.tokenClient.getUnit(unitId, false, NonFungibleTokenType),
        queryClient,
        createFetchTypeByIdQueryKey(
          QUERY_KEYS.NON_FUNGIBLE,
          serializedOwnerId,
          PartitionIdentifier.TOKEN,
          alphabill.network.id,
        ),
      );
      const result = new Map<string, NonFungibleTokenType>();
      for await (const unit of iterator) {
        result.set(unit.unitId.toString(), unit);
      }

      return result;
    },
    queryKey: createFetchUnitTypesQueryKey(
      QUERY_KEYS.NON_FUNGIBLE,
      serializedOwnerId,
      !!tokenTypes.length,
      PartitionIdentifier.TOKEN,
      alphabill?.network.id,
    ),
  });
}
