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
  resetUnitById(id: IUnitId, predicate: Predicate): Promise<void>;
  resetUnits(predicate: Predicate): Promise<void>;
  resetUnitList(predicate: Predicate): Promise<void>;
}

type Predicate = { partition: PartitionIdentifier; type: QUERY_KEYS };

export const Predicates = {
  ALPHA: {
    partition: PartitionIdentifier.MONEY,
    type: QUERY_KEYS.ALPHA,
  },
  FUNGIBLE_TOKEN: {
    partition: PartitionIdentifier.TOKEN,
    type: QUERY_KEYS.FUNGIBLE,
  },
  MONEY_PARTITION_FEE_CREDIT: {
    partition: PartitionIdentifier.MONEY,
    type: QUERY_KEYS.FEE_CREDIT,
  },
  NON_FUNGIBLE_TOKEN: {
    partition: PartitionIdentifier.TOKEN,
    type: QUERY_KEYS.NON_FUNGIBLE,
  },
  TOKEN_PARTITION_FEE_CREDIT: {
    partition: PartitionIdentifier.TOKEN,
    type: QUERY_KEYS.FEE_CREDIT,
  },
};

export function useResetQuery(): IResetQuery {
  const queryClient = useQueryClient();

  const resetUnitById = useCallback(
    async (id: IUnitId, { partition, type }: Predicate) => {
      await queryClient.resetQueries({
        predicate: (query) => createInvalidateUnitByIdPredicate(query, partition, type, id.toString()),
      });

      await queryClient.resetQueries({
        predicate: (query) => createInvalidateUnitsPredicate(query, partition, type),
      });

      await queryClient.resetQueries({
        predicate: (query) => createInvalidateUnitListPredicate(query, partition),
      });
    },
    [queryClient],
  );

  const resetUnits = useCallback(
    async ({ partition, type }: Predicate) => {
      await queryClient.resetQueries({
        predicate: (query) => createInvalidateUnitByIdPredicate(query, partition, type),
      });

      await queryClient.resetQueries({
        predicate: (query) => createInvalidateUnitsPredicate(query, partition, type),
      });

      await queryClient.resetQueries({
        predicate: (query) => createInvalidateUnitListPredicate(query, partition),
      });
    },
    [queryClient],
  );

  const resetUnitList = useCallback(
    async ({ partition, type }: Predicate) => {
      await queryClient.resetQueries({
        predicate: (query) => createInvalidateUnitListPredicate(query, partition),
      });

      await queryClient.resetQueries({
        predicate: (query) => createInvalidateUnitsPredicate(query, partition, type),
      });

      await queryClient.resetQueries({
        predicate: (query) => createInvalidateUnitByIdPredicate(query, partition, type),
      });
    },
    [queryClient],
  );

  return { resetUnitById, resetUnitList, resetUnits };
}
