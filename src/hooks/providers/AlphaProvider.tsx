import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { MoneyPartitionJsonRpcClient } from '@alphabill/alphabill-js-sdk/lib/json-rpc/MoneyPartitionJsonRpcClient';
import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery } from '@tanstack/react-query';
import { PropsWithChildren, ReactElement, useMemo } from 'react';

import { ALPHA_DECIMAL_PLACES, ALPHA_ICON, ALPHA_KEY, QUERY_KEYS } from '../../constants';
import { AlphaContext } from '../alpha';
import { useAlphabill } from '../alphabill';
import { IFungibleTokenInfo } from '../fungible/IFungibleTokenInfo';
import { fetchUnits } from '../units/fetchUnits';
import { useVault } from '../vault';

function createAlphaInfo(units: Bill[]): IFungibleTokenInfo<Bill> {
  return {
    decimalPlaces: ALPHA_DECIMAL_PLACES,
    icon: ALPHA_ICON,
    id: ALPHA_KEY,
    name: ALPHA_KEY,
    total: units.reduce((previous, current) => previous + current.value, 0n),
    units,
  };
}

export function AlphaProvider({ children }: PropsWithChildren): ReactElement {
  const alphabill = useAlphabill();
  const vault = useVault();

  const key = useMemo(() => {
    return Base16Converter.decode(vault.selectedKey?.publicKey ?? '');
  }, [vault.selectedKey]);

  const alphas = useQuery({
    enabled: !!vault.selectedKey && !!alphabill,
    queryFn: async (): Promise<Bill[]> => {
      if (!alphabill) {
        return [];
      }

      const { bills } = await alphabill.moneyClient.getUnitsByOwnerId(key);
      const iterator = fetchUnits(bills, (unitId: IUnitId) => alphabill.moneyClient.getUnit(unitId, false, Bill));
      const result: Bill[] = [];
      for await (const unit of iterator) {
        result.push(unit);
      }

      return result;
    },
    queryKey: [QUERY_KEYS.units, QUERY_KEYS.alpha, 'TOKENS', vault.selectedKey?.index, alphabill?.networkId],
  });

  const alphasInfo = useQuery({
    enabled: !!vault.selectedKey && !!alphabill && !!alphas.data,
    queryFn: (): IFungibleTokenInfo<Bill> => {
      if (!alphabill || !alphas.data) {
        return createAlphaInfo([]);
      }

      return createAlphaInfo(alphas.data);
    },
    queryKey: [QUERY_KEYS.units, QUERY_KEYS.alpha, 'INFO', vault.selectedKey?.index, alphabill?.networkId],
  });

  return <AlphaContext.Provider value={{ alphas, alphasInfo }}>{children}</AlphaContext.Provider>;
}
