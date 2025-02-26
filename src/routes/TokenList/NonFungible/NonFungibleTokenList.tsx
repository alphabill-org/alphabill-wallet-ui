import { ReactElement, ReactNode } from 'react';

import { NonFungibleTokenItem } from './NonFungibleTokenItem';
import { useNonFungibleTokensWithType } from '../../../hooks/nonFungibleTokenWithType';
import { INonFungibleTokenInfo } from '../../../hooks/tokens/INonFungibleTokenInfo';
import { useVault } from '../../../hooks/vaultContext';
import { TokenContent } from '../TokenContent';

export function NonFungibleTokenList(): ReactElement {
  const { selectedKey } = useVault();
  const nonFungibleTokens = useNonFungibleTokensWithType(selectedKey?.publicKey.key ?? null);

  return (
    <TokenContent selectedKey={selectedKey} query={nonFungibleTokens}>
      {nonFungibleTokens.data &&
        Array.from(nonFungibleTokens.data.values()).map((token: INonFungibleTokenInfo): ReactNode => {
          return (
            <NonFungibleTokenItem
              icon={token.icon}
              id={token.unitId.toString()}
              key={token.unitId.toString()}
              symbol={token.symbol}
            />
          );
        })}
    </TokenContent>
  );
}
