import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { FungibleToken } from '@alphabill/alphabill-js-sdk/lib/tokens/FungibleToken';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAlphabill } from './alphabillContext';
import { fetchUnits } from './units/fetchUnits';
import { useUnitsList } from './unitsList';
import { createFetchUnitByIdQueryKey, createFetchUnitsQueryKey, QUERY_KEYS } from '../utils/unitsQueryKeys';

export function useFungibleTokens(ownerId: Uint8Array | null): UseQueryResult<Map<string, FungibleToken> | null> {
  const queryClient = useQueryClient();
  const alphabill = useAlphabill();
  const unitsList = useUnitsList(ownerId, PartitionIdentifier.TOKEN);

  const serializedOwnerId = useMemo(() => (ownerId ? Base16Converter.encode(ownerId) : null), [ownerId]);

  return useQuery<Map<string, FungibleToken> | null>({
    queryFn: async () => {
      if (!alphabill || !ownerId || !unitsList.data) {
        return Promise.resolve(null);
      }

      const iterator = fetchUnits(
        unitsList.data.fungibleTokens,
        (unitId: IUnitId) => alphabill.tokenClient.getUnit(unitId, false, FungibleToken),
        queryClient,
        createFetchUnitByIdQueryKey(QUERY_KEYS.FEE_CREDIT, serializedOwnerId, alphabill.network.id),
      );
      const result = new Map<string, FungibleToken>();
      for await (const unit of iterator) {
        result.set(unit.unitId.toString(), unit);
      }

      return result;
    },
    queryKey: createFetchUnitsQueryKey(
      QUERY_KEYS.FEE_CREDIT,
      serializedOwnerId,
      !!unitsList.data?.fungibleTokens.length,
      alphabill?.network.id,
    ),
  });
}
