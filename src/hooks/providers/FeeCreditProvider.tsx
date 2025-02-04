import { FeeCreditRecord } from '@alphabill/alphabill-js-sdk/lib/fees/FeeCreditRecord';
import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery } from '@tanstack/react-query';
import { PropsWithChildren, ReactElement, useMemo } from 'react';

import { QUERY_KEYS } from '../../constants';
import { useAlphabill } from '../alphabill';
import { FeeCreditContext } from '../feecredit';
import { fetchUnits } from '../units/fetchUnits';
import { useVault } from '../vault';

export function FeeCreditProvider({ children }: PropsWithChildren): ReactElement {
  const alphabill = useAlphabill();
  const vault = useVault();

  const key = useMemo(() => {
    return Base16Converter.decode(vault.selectedKey?.publicKey ?? '');
  }, [vault.selectedKey]);

  const feeCredit = useQuery({
    enabled: !!vault.selectedKey && !!alphabill,
    queryFn: async (): Promise<FeeCreditRecord[]> => {
      if (!alphabill) {
        return Promise.resolve([]);
      }

      const units = await alphabill.moneyClient.getUnitsByOwnerId(key);
      const iterator = fetchUnits(units.feeCreditRecords, (unitId: IUnitId) =>
        alphabill.moneyClient.getUnit(unitId, false, FeeCreditRecord),
      );
      const result: FeeCreditRecord[] = [];
      for await (const unit of iterator) {
        result.push(unit);
      }

      return result;
    },
    queryKey: [QUERY_KEYS.units, QUERY_KEYS.feeCredit, vault.selectedKey?.index, alphabill?.networkId],
  });

  return <FeeCreditContext.Provider value={{ feeCredit }}>{children}</FeeCreditContext.Provider>;
}
