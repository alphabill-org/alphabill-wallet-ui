import { ReactElement, ReactNode } from 'react';

import { NonFungibleTokenItem } from './NonFungibleTokenItem';
import { useNonFungibleTokens } from '../../../hooks/nonFungibleToken';
import { useVault } from '../../../hooks/vaultContext';

export function NonFungibleTokenList(): ReactElement {
  const { selectedKey } = useVault();
  const nonFungibleTokens = useNonFungibleTokens(selectedKey?.publicKey.key ?? null);

  return (
    <div className="units__content">
      {nonFungibleTokens.data &&
        Array.from(nonFungibleTokens.data.values()).map((token): ReactNode => {
          return (
            <NonFungibleTokenItem
              icon={token.icon}
              id={token.unitId.toString()}
              key={token.unitId.toString()}
              name={token.name}
            />
          );
        })}
    </div>
  );
}
