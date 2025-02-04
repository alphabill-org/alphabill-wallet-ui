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

async function getAlphaInfo(
  ownerId: Uint8Array,
  moneyClient: MoneyPartitionJsonRpcClient,
): Promise<IFungibleTokenInfo<Bill>> {
  const units = [];
  const { bills } = await moneyClient.getUnitsByOwnerId(ownerId);
  const iterator = fetchUnits(bills, (unitId: IUnitId) => moneyClient.getUnit(unitId, false, Bill));
  for await (const unit of iterator) {
    units.push(unit);
  }

  return createAlphaInfo(units);
}

export function AlphaProvider({ children }: PropsWithChildren): ReactElement {
  const alphabill = useAlphabill();
  const vault = useVault();

  const key = useMemo(() => {
    return Base16Converter.decode(vault.selectedKey?.publicKey ?? '');
  }, [vault.selectedKey]);

  const alpha = useQuery({
    enabled: !!vault.selectedKey && !!alphabill,
    queryFn: (): Promise<IFungibleTokenInfo<Bill>> => {
      if (!alphabill) {
        return Promise.resolve(createAlphaInfo([]));
      }

      return getAlphaInfo(key, alphabill.moneyClient);
    },
    queryKey: [QUERY_KEYS.units, QUERY_KEYS.alpha, vault.selectedKey?.index, alphabill?.networkId],
  });

  return <AlphaContext.Provider value={{ alpha }}>{children}</AlphaContext.Provider>;
}
