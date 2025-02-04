import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { TokenPartitionJsonRpcClient } from '@alphabill/alphabill-js-sdk/lib/json-rpc/TokenPartitionJsonRpcClient';
import { FungibleToken } from '@alphabill/alphabill-js-sdk/lib/tokens/FungibleToken';
import { FungibleTokenType } from '@alphabill/alphabill-js-sdk/lib/tokens/FungibleTokenType';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQuery } from '@tanstack/react-query';
import { PropsWithChildren, ReactElement, useMemo } from 'react';

import { QUERY_KEYS } from '../../constants';
import { useAlphabill } from '../alphabill';
import { FungibleTokenContext } from '../fungible';
import { IFungibleTokenInfo } from '../fungible/IFungibleTokenInfo';
import { fetchUnits } from '../units/fetchUnits';
import { useVault } from '../vault';

const textDecoder = new TextDecoder();

async function getFungibleTokenInfo(
  ownerId: Uint8Array,
  tokenClient: TokenPartitionJsonRpcClient,
): Promise<IFungibleTokenInfo<FungibleToken>[]> {
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

  const result: IFungibleTokenInfo<FungibleToken>[] = [];
  for (const [typeId, units] of tokens) {
    const type = await tokenClient.getUnit(units[0].typeId, false, FungibleTokenType);
    if (!type) {
      continue;
    }

    result.push({
      decimalPlaces: type.decimalPlaces,
      icon: {
        data: btoa(textDecoder.decode(type.icon.data)),
        type: type.icon.type,
      },
      id: typeId,
      name: type.name,
      total: units.reduce((previous, current) => previous + current.value, 0n),
      units,
    });
  }

  return result;
}

export function FungibleTokenProvider({ children }: PropsWithChildren): ReactElement {
  const alphabill = useAlphabill();
  const vault = useVault();

  const key = useMemo(() => {
    return Base16Converter.decode(vault.selectedKey?.publicKey ?? '');
  }, [vault.selectedKey]);

  const fungible = useQuery({
    enabled: !!vault.selectedKey && !!alphabill,
    queryFn: (): Promise<IFungibleTokenInfo<FungibleToken>[]> => {
      if (!alphabill) {
        return Promise.resolve([]);
      }

      return getFungibleTokenInfo(key, alphabill.tokenClient);
    },
    queryKey: [QUERY_KEYS.units, QUERY_KEYS.fungible, vault.selectedKey?.index, alphabill?.networkId],
  });

  return <FungibleTokenContext.Provider value={{ fungible }}>{children}</FungibleTokenContext.Provider>;
}
