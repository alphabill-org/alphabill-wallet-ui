import { MoneyPartitionUnitIdResponse } from '@alphabill/alphabill-js-sdk/lib/json-rpc/MoneyPartitionUnitIdResponse';
import { TokenPartitionUnitIdResponse } from '@alphabill/alphabill-js-sdk/lib/json-rpc/TokenPartitionUnitIdResponse';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAlphabill } from './alphabillContext';
import { createUnitListQueryKey } from '../utils/unitsQueryKeys';

type Response<T> = T extends PartitionIdentifier.MONEY ? MoneyPartitionUnitIdResponse : TokenPartitionUnitIdResponse;

export function useUnitsList<T extends PartitionIdentifier.MONEY | PartitionIdentifier.TOKEN>(
  ownerId: Uint8Array | null,
  partition: T,
): UseQueryResult<Response<T> | null> {
  const alphabill = useAlphabill();

  const serializedOwnerId = useMemo(() => (ownerId ? Base16Converter.encode(ownerId) : null), [ownerId]);

  return useQuery<Response<T> | null>({
    queryFn: () => {
      if (!alphabill || !ownerId) {
        return Promise.resolve(null);
      }

      const client = partition === PartitionIdentifier.MONEY ? alphabill.moneyClient : alphabill.tokenClient;
      return client.getUnitsByOwnerId(ownerId) as Promise<Response<T>>;
    },
    queryKey: createUnitListQueryKey(serializedOwnerId, partition, alphabill?.network.id),
  });
}
