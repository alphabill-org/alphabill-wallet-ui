import { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { ALPHA_KEY } from '../../../constants';
import { useAggregatedAlphas } from '../../../hooks/aggregatedAlpha';
import { useVault } from '../../../hooks/vaultContext';
import { AggregatedFungibleTokenItem } from '../Fungible/AggregatedFungibleTokenItem';
import { TokenContent } from '../TokenContent';

export function AggregatedAlphaList(): ReactElement {
  const { selectedKey } = useVault();
  const alphas = useAggregatedAlphas(selectedKey?.publicKey.key ?? null);

  return (
    <TokenContent selectedKey={selectedKey} query={alphas}>
      {alphas.data && (
        <Link key={ALPHA_KEY} to={`/units/fungible/${ALPHA_KEY}`}>
          <AggregatedFungibleTokenItem
            name={alphas.data.name}
            icon={alphas.data.icon}
            decimalPlaces={alphas.data.decimalPlaces}
            value={alphas.data.total}
          />
        </Link>
      )}
    </TokenContent>
  );
}
