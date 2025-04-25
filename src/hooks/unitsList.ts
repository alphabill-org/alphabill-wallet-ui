import { MoneyPartitionUnitIdResponse } from '@alphabill/alphabill-js-sdk/lib/json-rpc/MoneyPartitionUnitIdResponse';
import { TokenPartitionUnitIdResponse } from '@alphabill/alphabill-js-sdk/lib/json-rpc/TokenPartitionUnitIdResponse';
import { PartitionTypeIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionTypeIdentifier';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAlphabill } from './alphabillContext';
import { createUnitListQueryKey } from '../utils/unitsQueryKeys';

type Response<T> = T extends PartitionTypeIdentifier.MONEY
  ? MoneyPartitionUnitIdResponse
  : TokenPartitionUnitIdResponse;

export function useUnitsList<T extends PartitionTypeIdentifier.MONEY | PartitionTypeIdentifier.TOKEN>(
  ownerId: Uint8Array | null,
  partition: T,
): UseQueryResult<Response<T> | null> {
  const alphabill = useAlphabill();

  const serializedOwnerId = useMemo(() => (ownerId ? Base16Converter.encode(ownerId) : null), [ownerId]);

  return useQuery<Response<T> | null>({
    queryFn: () => {
      if (!alphabill) {
        throw new Error('Invalid Alphabill context.');
      }

      if (!ownerId) {
        throw new Error('Invalid owner ID.');
      }

      const client = partition === PartitionTypeIdentifier.MONEY ? alphabill.moneyClient : alphabill.tokenClient;
      return client.getUnitsByOwnerId(ownerId) as Promise<Response<T>>;
    },
    queryKey: createUnitListQueryKey(serializedOwnerId, partition, alphabill?.network.id),
  });
}
