import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { NonFungibleToken } from '@alphabill/alphabill-js-sdk/lib/tokens/NonFungibleToken';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAlphabill } from './alphabillContext';
import { fetchUnits } from './units/fetchUnits';
import { useUnitsList } from './unitsList';
import { createFetchUnitByIdQueryKey, createFetchUnitsQueryKey, QUERY_KEYS } from '../utils/unitsQueryKeys';

export function useNonFungibleTokens(ownerId: Uint8Array | null): UseQueryResult<Map<string, NonFungibleToken> | null> {
  const queryClient = useQueryClient();
  const alphabill = useAlphabill();
  const unitsList = useUnitsList(ownerId, PartitionIdentifier.TOKEN);

  const serializedOwnerId = useMemo(() => (ownerId ? Base16Converter.encode(ownerId) : null), [ownerId]);

  return useQuery<Map<string, NonFungibleToken> | null>({
    queryFn: async () => {
      if (!alphabill) {
        throw new Error('Invalid Alphabill context.');
      }

      if (!ownerId) {
        throw new Error('Invalid owner ID.');
      }

      if (!unitsList.isPending && unitsList.data === undefined) {
        throw new Error('Unable to connect to Alphabill network.');
      }

      if (!unitsList.data) {
        return Promise.resolve(null);
      }

      const iterator = fetchUnits(
        unitsList.data.nonFungibleTokens,
        (unitId: IUnitId) => alphabill.tokenClient.getUnit(unitId, false, NonFungibleToken),
        queryClient,
        createFetchUnitByIdQueryKey(
          QUERY_KEYS.NON_FUNGIBLE,
          serializedOwnerId,
          PartitionIdentifier.TOKEN,
          alphabill.network.id,
        ),
      );
      const result = new Map<string, NonFungibleToken>();
      for await (const unit of iterator) {
        result.set(unit.unitId.toString(), unit);
      }

      return result;
    },
    queryKey: createFetchUnitsQueryKey(
      QUERY_KEYS.NON_FUNGIBLE,
      serializedOwnerId,
      !!unitsList.data?.nonFungibleTokens.length,
      PartitionIdentifier.TOKEN,
      alphabill?.network.id,
    ),
  });
}
