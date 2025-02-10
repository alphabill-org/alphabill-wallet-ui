import { MoneyPartitionUnitIdResponse } from '@alphabill/alphabill-js-sdk/lib/json-rpc/MoneyPartitionUnitIdResponse';
import { TokenPartitionUnitIdResponse } from '@alphabill/alphabill-js-sdk/lib/json-rpc/TokenPartitionUnitIdResponse';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { QUERY_KEYS } from '../constants';
import { useAlphabill } from './alphabillContext';

export function useUnitsList<T extends PartitionIdentifier.MONEY | PartitionIdentifier.TOKEN>(
  ownerId: Uint8Array | null,
  partition: T,
): UseQueryResult<T extends PartitionIdentifier.MONEY ? MoneyPartitionUnitIdResponse : TokenPartitionUnitIdResponse> {
  const alphabill = useAlphabill();

  const serializedOwnerId = useMemo(() => (ownerId ? Base16Converter.encode(ownerId) : null), [ownerId]);

  return useQuery({
    queryFn: () => {
      if (!alphabill || !ownerId) {
        return Promise.resolve(
          partition === PartitionIdentifier.MONEY
            ? new MoneyPartitionUnitIdResponse([])
            : new TokenPartitionUnitIdResponse([]),
        );
      }

      const client = partition === PartitionIdentifier.MONEY ? alphabill.moneyClient : alphabill.tokenClient;
      return client.getUnitsByOwnerId(ownerId);
    },
    queryKey: [QUERY_KEYS.units, 'ID', partition, serializedOwnerId, alphabill?.network.id],
  });
}
