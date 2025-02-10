import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  createInvalidateUnitByIdPredicate,
  createInvalidateUnitListPredicate,
  createInvalidateUnitsPredicate,
  QUERY_KEYS,
} from '../utils/unitsQueryKeys';

interface IResetQuery {
  resetUnitById(id: IUnitId, type: QUERY_KEYS): Promise<void>;
  resetUnitList(partition: PartitionIdentifier): Promise<void>;
}

export function useResetQuery(): IResetQuery {
  const queryClient = useQueryClient();

  const resetUnitById = useCallback(
    async (id: IUnitId, type: QUERY_KEYS) => {
      await queryClient.resetQueries({
        predicate: (query) => createInvalidateUnitByIdPredicate(query, type, id.toString()),
      });

      await queryClient.resetQueries({
        predicate: (query) => createInvalidateUnitsPredicate(query, QUERY_KEYS.ALPHA),
      });
    },
    [queryClient],
  );

  const resetUnitList = useCallback(
    async (partition: PartitionIdentifier) => {
      await queryClient.resetQueries({
        predicate: (query) => createInvalidateUnitListPredicate(query, partition),
      });
    },
    [queryClient],
  );

  return { resetUnitById, resetUnitList };
}
