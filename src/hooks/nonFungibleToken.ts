import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { NonFungibleToken } from '@alphabill/alphabill-js-sdk/lib/tokens/NonFungibleToken';
import { NonFungibleTokenType } from '@alphabill/alphabill-js-sdk/lib/tokens/NonFungibleTokenType';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAlphabill } from './alphabillContext';
import { fetchUnits } from './units/fetchUnits';
import { useUnitsList } from './unitsList';
import { createFetchUnitByIdQueryKey, createFetchUnitsQueryKey, QUERY_KEYS } from '../utils/unitsQueryKeys';
import { INonFungibleTokenInfo } from './tokens/INonFungibleTokenInfo';

export function useNonFungibleTokens(
  ownerId: Uint8Array | null,
): UseQueryResult<Map<string, INonFungibleTokenInfo> | null> {
  const queryClient = useQueryClient();
  const alphabill = useAlphabill();
  const unitsList = useUnitsList(ownerId, PartitionIdentifier.TOKEN);

  const serializedOwnerId = useMemo(() => (ownerId ? Base16Converter.encode(ownerId) : null), [ownerId]);

  return useQuery<Map<string, INonFungibleTokenInfo> | null>({
    queryFn: async () => {
      if (!alphabill || !ownerId || !unitsList.data) {
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
      const result = new Map<string, INonFungibleTokenInfo>();
      for await (const unit of iterator) {
        const tokenType = await alphabill.tokenClient.getUnit(unit.typeId, false, NonFungibleTokenType);
        if (!tokenType) {
          // TODO: Do something with tokens which are missing type
          continue;
        }

        result.set(unit.unitId.toString(), {
          counter: unit.counter,
          icon: { data: btoa(new TextDecoder().decode(tokenType.icon.data)), type: tokenType.icon.type },
          name: unit.name,
          typeId: unit.typeId,
          unitId: unit.unitId,
        });
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
