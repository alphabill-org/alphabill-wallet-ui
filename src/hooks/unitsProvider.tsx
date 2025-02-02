import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { MoneyPartitionJsonRpcClient } from '@alphabill/alphabill-js-sdk/lib/json-rpc/MoneyPartitionJsonRpcClient';
import { TokenPartitionJsonRpcClient } from '@alphabill/alphabill-js-sdk/lib/json-rpc/TokenPartitionJsonRpcClient';
import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { FungibleToken } from '@alphabill/alphabill-js-sdk/lib/tokens/FungibleToken';
import { FungibleTokenType } from '@alphabill/alphabill-js-sdk/lib/tokens/FungibleTokenType';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery } from '@tanstack/react-query';
import { PropsWithChildren, ReactElement } from 'react';

import { useAlphabill } from './alphabillContext';
import { useVault } from './vaultContext';
import { ALPHA_DECIMAL_PLACES, ALPHA_ICON, CONCURRENT_QUERIES, QUERY_KEYS } from '../constants';
import { UnitsContext } from './unitsContext';

const textDecoder = new TextDecoder();

async function* fetchUnits<T>(
  data: ReadonlyArray<IUnitId>,
  create: (unitId: IUnitId) => Promise<T | null>,
): AsyncGenerator<T> {
  const input = [...data];
  let i = 0;
  const promises = new Map<number, Promise<{ id: number; data: T | null }>>();
  while (input.length > 0 || promises.size > 0) {
    const unitId = input.shift();
    if (unitId) {
      const id = i;
      promises.set(
        id,
        create(unitId).then((data) => {
          return {
            data,
            id,
          };
        }),
      );
    }

    if (promises.size >= CONCURRENT_QUERIES || !unitId) {
      const { id, data } = await Promise.race(promises.values());
      promises.delete(id);
      if (!data) {
        continue;
      }

      yield data;
    }

    i += 1;
  }
}

async function getAlphaInfo(ownerId: Uint8Array, moneyClient: MoneyPartitionJsonRpcClient): Promise<ITokenInfo> {
  const units = [];
  const { bills } = await moneyClient.getUnitsByOwnerId(ownerId);
  const iterator = fetchUnits(bills, (unitId: IUnitId) => moneyClient.getUnit(unitId, false, Bill));
  for await (const unit of iterator) {
    units.push({
      id: Base16Converter.encode(unit.unitId.bytes),
      value: unit.value,
    });
  }

  return {
    decimalPlaces: ALPHA_DECIMAL_PLACES,
    icon: ALPHA_ICON,
    id: 'ALPHA',
    name: 'ALPHA',
    total: units.reduce((previous, current) => previous + current.value, 0n),
    units,
  };
}

async function getFungibleTokenInfo(
  ownerId: Uint8Array,
  moneyClient: MoneyPartitionJsonRpcClient,
  tokenClient: TokenPartitionJsonRpcClient,
): Promise<Map<string, ITokenInfo>> {
  const tokens = new Map<string, FungibleToken[]>();
  const { fungibleTokens } = await tokenClient.getUnitsByOwnerId(ownerId);
  const iterator = fetchUnits(fungibleTokens, (unitId: IUnitId) => tokenClient.getUnit(unitId, false, FungibleToken));
  for await (const unit of iterator) {
    const typeId = Base16Converter.encode(unit.typeId.bytes);
    const typeTokens = tokens.get(typeId) ?? [];
    if (typeTokens.length === 0) {
      tokens.set(typeId, typeTokens);
    }

    typeTokens.push(unit);
  }

  const result = new Map<string, ITokenInfo>();
  result.set('ALPHA', await getAlphaInfo(ownerId, moneyClient));
  for (const [typeId, units] of tokens) {
    const type = await tokenClient.getUnit(units[0].typeId, false, FungibleTokenType);
    if (!type) {
      continue;
    }

    result.set(typeId, {
      decimalPlaces: type.decimalPlaces,
      icon: {
        data: btoa(textDecoder.decode(type.icon.data)),
        type: type.icon.type,
      },
      id: typeId,
      name: type.name,
      total: units.reduce((previous, current) => previous + current.value, 0n),
      units: units.map((unit) => {
        return {
          id: Base16Converter.encode(unit.unitId.bytes),
          value: unit.value,
        };
      }),
    });
  }

  return result;
}

export function UnitsProvider({ children }: PropsWithChildren): ReactElement {
  const alphabill = useAlphabill();
  const vault = useVault();

  const key = Base16Converter.decode(vault.selectedKey?.publicKey ?? '');

  const fungible = useQuery({
    enabled: !!vault.selectedKey && !!alphabill,
    queryFn: (): Promise<Map<string, ITokenInfo>> => {
      if (!alphabill) {
        return Promise.resolve(new Map());
      }

      return getFungibleTokenInfo(key, alphabill.moneyClient, alphabill.tokenClient);
    },
    queryKey: [QUERY_KEYS.units, QUERY_KEYS.fungible, vault.selectedKey?.index, alphabill?.networkId],
  });

  return <UnitsContext.Provider value={{ fungible }}>{children}</UnitsContext.Provider>;
}
