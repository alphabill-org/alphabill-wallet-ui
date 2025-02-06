import { FeeCreditRecord } from '@alphabill/alphabill-js-sdk/lib/fees/FeeCreditRecord';
import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PropsWithChildren, ReactElement, useCallback, useMemo } from 'react';

import { QUERY_KEYS } from '../../constants';
import { useAlphabill } from '../alphabill';
import { FeeCreditContext } from '../feecredit';
import { fetchUnits } from '../units/fetchUnits';
import { useVault } from '../vault';

async function fetchFeeCredits(
  units: readonly IUnitId[],
  create: (unitId: IUnitId) => Promise<FeeCreditRecord | null>,
): Promise<FeeCreditRecord[]> {
  const iterator = fetchUnits(units, create);
  const result: FeeCreditRecord[] = [];
  for await (const unit of iterator) {
    result.push(unit);
  }

  return result;
}

export function FeeCreditProvider({ children }: PropsWithChildren): ReactElement {
  const queryClient = useQueryClient();
  const alphabill = useAlphabill();
  const vault = useVault();

  const key = useMemo(() => {
    return Base16Converter.decode(vault.selectedKey?.publicKey ?? '');
  }, [vault.selectedKey]);

  const moneyFeeCredits = useQuery({
    enabled: !!vault.selectedKey && !!alphabill,
    queryFn: async (): Promise<FeeCreditRecord[]> => {
      if (!alphabill) {
        return Promise.resolve([]);
      }

      const { feeCreditRecords } = await alphabill.moneyClient.getUnitsByOwnerId(key);
      return fetchFeeCredits(feeCreditRecords, (unitId) =>
        alphabill.moneyClient.getUnit(unitId, false, FeeCreditRecord),
      );
    },
    queryKey: [QUERY_KEYS.units, QUERY_KEYS.feeCredit, 'MONEY', vault.selectedKey?.index, alphabill?.networkId],
  });

  const tokenFeeCredits = useQuery({
    enabled: !!vault.selectedKey && !!alphabill,
    queryFn: async (): Promise<FeeCreditRecord[]> => {
      if (!alphabill) {
        return Promise.resolve([]);
      }

      const { feeCreditRecords } = await alphabill.tokenClient.getUnitsByOwnerId(key);
      return fetchFeeCredits(feeCreditRecords, (unitId) =>
        alphabill.tokenClient.getUnit(unitId, false, FeeCreditRecord),
      );
    },
    queryKey: [QUERY_KEYS.units, QUERY_KEYS.feeCredit, 'TOKEN', vault.selectedKey?.index, alphabill?.networkId],
  });

  const resetFeeCredits = useCallback(async (): Promise<void> => {
    await queryClient.resetQueries({
      predicate: (query) => {
        return query.queryKey.at(0) === QUERY_KEYS.units && query.queryKey.at(1) === QUERY_KEYS.feeCredit;
      },
    });
  }, [queryClient]);

  return (
    <FeeCreditContext.Provider value={{ moneyFeeCredits, resetFeeCredits, tokenFeeCredits }}>
      {children}
    </FeeCreditContext.Provider>
  );
}
