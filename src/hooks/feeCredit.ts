import { FeeCreditRecord } from '@alphabill/alphabill-js-sdk/lib/fees/FeeCreditRecord';
import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useAlphabill } from './alphabillContext';
import { fetchUnits } from './units/fetchUnits';
import { useUnitsList } from './unitsList';
import { createFetchUnitByIdQueryKey, createFetchUnitsQueryKey, QUERY_KEYS } from '../utils/unitsQueryKeys';

export function useFeeCredits(
  ownerId: Uint8Array | null,
  partition: PartitionIdentifier.MONEY | PartitionIdentifier.TOKEN,
): UseQueryResult<Map<string, FeeCreditRecord>> {
  const queryClient = useQueryClient();
  const alphabill = useAlphabill();
  const unitsList = useUnitsList(ownerId, partition);

  const serializedOwnerId = useMemo(() => (ownerId ? Base16Converter.encode(ownerId) : null), [ownerId]);

  const getUnitFromMoneyPartition = useCallback(
    (unitId: IUnitId) => alphabill?.moneyClient.getUnit(unitId, false, FeeCreditRecord) ?? Promise.resolve(null),
    [alphabill],
  );
  const getUnitFromTokenPartition = useCallback(
    (unitId: IUnitId) => alphabill?.tokenClient.getUnit(unitId, false, FeeCreditRecord) ?? Promise.resolve(null),
    [alphabill],
  );

  return useQuery<Map<string, FeeCreditRecord>>({
    queryFn: async () => {
      if (!alphabill || !ownerId || !unitsList.data) {
        return Promise.resolve(new Map());
      }

      const iterator = fetchUnits(
        unitsList.data.feeCreditRecords,
        partition === PartitionIdentifier.MONEY ? getUnitFromMoneyPartition : getUnitFromTokenPartition,
        queryClient,
        createFetchUnitByIdQueryKey(QUERY_KEYS.FEE_CREDIT, serializedOwnerId, alphabill.network.id, partition),
      );
      const result = new Map<string, FeeCreditRecord>();
      for await (const unit of iterator) {
        result.set(unit.unitId.toString(), unit);
      }

      return result;
    },
    queryKey: createFetchUnitsQueryKey(
      QUERY_KEYS.FEE_CREDIT,
      serializedOwnerId,
      unitsList.data?.feeCreditRecords,
      alphabill?.network.id,
      partition,
    ),
  });
}
