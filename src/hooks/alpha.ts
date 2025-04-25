import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { PartitionTypeIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionTypeIdentifier';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAlphabill } from './alphabillContext';
import { fetchUnits } from './units/fetchUnits';
import { useUnitsList } from './unitsList';
import { createFetchUnitByIdQueryKey, createFetchUnitsQueryKey, QUERY_KEYS } from '../utils/unitsQueryKeys';

export function useAlphas(ownerId: Uint8Array | null): UseQueryResult<Map<string, Bill> | null> {
  const queryClient = useQueryClient();
  const alphabill = useAlphabill();
  const unitsList = useUnitsList(ownerId, PartitionTypeIdentifier.MONEY);

  const serializedOwnerId = useMemo(() => (ownerId ? Base16Converter.encode(ownerId) : null), [ownerId]);

  return useQuery<Map<string, Bill> | null>({
    queryFn: async () => {
      if (unitsList.isError) {
        throw new Error('Unable to connect to Alphabill network.');
      }

      if (!alphabill || !ownerId || !unitsList.data) {
        return Promise.resolve(null);
      }

      const iterator = fetchUnits(
        unitsList.data.bills,
        (unitId: IUnitId) => alphabill.moneyClient.getUnit(unitId, false, Bill),
        queryClient,
        createFetchUnitByIdQueryKey(
          QUERY_KEYS.ALPHA,
          serializedOwnerId,
          PartitionTypeIdentifier.MONEY,
          alphabill.network.id,
        ),
      );
      const result = new Map<string, Bill>();
      for await (const unit of iterator) {
        result.set(unit.unitId.toString(), unit);
      }

      return result;
    },
    queryKey: [
      ...createFetchUnitsQueryKey(
        QUERY_KEYS.ALPHA,
        serializedOwnerId,
        !!unitsList.data?.bills.length,
        PartitionTypeIdentifier.MONEY,
        alphabill?.network.id,
      ),
      unitsList.isError,
    ],
  });
}
