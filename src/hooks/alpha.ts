import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { QUERY_KEYS } from '../constants';
import { useAlphabill } from './alphabillContext';
import { fetchUnits } from './units/fetchUnits';
import { useUnitsList } from './unitsList';

export function useAlphas(ownerId: Uint8Array | null): UseQueryResult<Map<string, Bill>> {
  const queryClient = useQueryClient();
  const alphabill = useAlphabill();
  const unitsList = useUnitsList(ownerId, PartitionIdentifier.MONEY);

  const serializedOwnerId = useMemo(() => (ownerId ? Base16Converter.encode(ownerId) : null), [ownerId]);

  return useQuery({
    queryFn: async () => {
      if (!alphabill || !ownerId || !unitsList.data) {
        return Promise.resolve(new Map());
      }

      const iterator = fetchUnits(
        unitsList.data.bills,
        (unitId: IUnitId) => alphabill.moneyClient.getUnit(unitId, false, Bill),
        queryClient,
        (unitId: IUnitId) => [
          QUERY_KEYS.units,
          QUERY_KEYS.alpha,
          'UNIT',
          unitId.toString(),
          serializedOwnerId,
          alphabill?.network.id,
        ],
      );
      const result = new Map<string, Bill>();
      for await (const unit of iterator) {
        result.set(unit.unitId.toString(), unit);
      }

      return result;
    },
    queryKey: [
      QUERY_KEYS.units,
      QUERY_KEYS.alpha,
      'UNITS',
      unitsList.data?.bills.map((unit) => unit.toString()),
      serializedOwnerId,
      alphabill?.network.id,
    ],
  });
}
