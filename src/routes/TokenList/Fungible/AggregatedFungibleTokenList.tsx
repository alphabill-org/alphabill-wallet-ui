import { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { AggregatedFungibleTokenItem } from './AggregatedFungibleTokenItem';
import { useAggregatedFungibleTokens } from '../../../hooks/aggregatedFungibleTokens';
import { useVault } from '../../../hooks/vaultContext';
import { TokenContent } from '../TokenContent';

export function AggregatedFungibleTokenList(): ReactElement {
  const { selectedKey } = useVault();
  const fungibleTokens = useAggregatedFungibleTokens(selectedKey?.publicKey.key ?? null);

  return (
    <TokenContent selectedKey={selectedKey} query={fungibleTokens}>
      {fungibleTokens.data &&
        Array.from(fungibleTokens.data.values()).map((token): ReactNode => {
          return (
            <Link key={token.id} to={`/units/fungible/${token.id}`}>
              <AggregatedFungibleTokenItem
                symbol={token.symbol}
                icon={token.icon}
                decimalPlaces={token.decimalPlaces}
                value={token.total}
              />
            </Link>
          );
        })}
    </TokenContent>
  );
}
