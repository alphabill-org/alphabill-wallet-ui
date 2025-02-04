import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
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

export function FungibleTokenProvider({ children }: PropsWithChildren): ReactElement {
  const alphabill = useAlphabill();
  const vault = useVault();

  const key = useMemo(() => {
    return Base16Converter.decode(vault.selectedKey?.publicKey ?? '');
  }, [vault.selectedKey]);

  const fungibleTokens = useQuery({
    enabled: !!vault.selectedKey && !!alphabill,
    queryFn: async (): Promise<FungibleToken[]> => {
      if (!alphabill) {
        return [];
      }

      const { fungibleTokens } = await alphabill.tokenClient.getUnitsByOwnerId(key);
      const iterator = fetchUnits(fungibleTokens, (unitId: IUnitId) =>
        alphabill.tokenClient.getUnit(unitId, false, FungibleToken),
      );
      const result: FungibleToken[] = [];
      for await (const unit of iterator) {
        result.push(unit);
      }

      return result;
    },
    queryKey: [QUERY_KEYS.units, QUERY_KEYS.fungible, 'TOKENS', vault.selectedKey?.index, alphabill?.networkId],
  });

  const fungibleTokenTypes = useQuery({
    enabled: !!vault.selectedKey && !!alphabill && !!fungibleTokens.data,
    queryFn: async (): Promise<Map<string, FungibleTokenType>> => {
      if (!alphabill || !fungibleTokens.data) {
        return new Map();
      }

      const tokenTypes = new Set();
      let typesToLoad: IUnitId[] = [];
      for (const unit of fungibleTokens.data) {
        const typeId = Base16Converter.encode(unit.typeId.bytes);
        if (!tokenTypes.has(typeId)) {
          tokenTypes.add(typeId);
          typesToLoad.push(unit.typeId);
        }
      }

      const result = new Map<string, FungibleTokenType>();

      while (typesToLoad.length > 0) {
        const iterator = fetchUnits(typesToLoad, (unitId) =>
          alphabill.tokenClient.getUnit(unitId, false, FungibleTokenType),
        );
        typesToLoad = [];
        for await (const type of iterator) {
          result.set(type.unitId.toString(), type);
          if (type.parentTypeId && !tokenTypes.has(type.parentTypeId.toString())) {
            tokenTypes.add(type.parentTypeId.toString());
            typesToLoad.push(type.parentTypeId);
          }
        }
      }

      return result;
    },
    queryKey: [QUERY_KEYS.units, QUERY_KEYS.fungible, 'TYPES', vault.selectedKey?.index, alphabill?.networkId],
  });

  const fungibleTokensByType = useQuery({
    enabled: !!vault.selectedKey && !!alphabill && !!fungibleTokens.data && !!fungibleTokenTypes.data,
    queryFn: (): Map<string, IFungibleTokenInfo<FungibleToken>> => {
      if (!alphabill || !fungibleTokens.data || !fungibleTokenTypes.data) {
        return new Map();
      }

      const tokensByType = new Map<string, FungibleToken[]>();
      for (const unit of fungibleTokens.data) {
        const typeId = unit.typeId.toString();
        const tokens = tokensByType.get(typeId) ?? [];
        if (tokens.length === 0) {
          tokensByType.set(typeId, tokens);
        }

        tokens.push(unit);
      }

      const result = new Map<string, IFungibleTokenInfo<FungibleToken>>();
      for (const [typeId, units] of tokensByType.entries()) {
        const type = fungibleTokenTypes.data.get(typeId);
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
          units,
        });
      }

      return result;
    },
    queryKey: [QUERY_KEYS.units, QUERY_KEYS.fungible, 'GROUP_BY_TYPE', vault.selectedKey?.index, alphabill?.networkId],
  });

  return (
    <FungibleTokenContext.Provider value={{ fungibleTokenTypes, fungibleTokens, fungibleTokensByType }}>
      {children}
    </FungibleTokenContext.Provider>
  );
}
