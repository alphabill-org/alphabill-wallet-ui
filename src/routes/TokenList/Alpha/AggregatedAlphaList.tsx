import { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { ALPHA_KEY } from '../../../constants';
import { useAggregatedAlphas } from '../../../hooks/aggregatedAlpha';
import { useVault } from '../../../hooks/vaultContext';
import { TokenContent } from '../TokenContent';
import { AggregatedAlphaItem } from './AggregatedAlphaItem';

export function AggregatedAlphaList(): ReactElement {
  const { selectedKey } = useVault();
  const alphas = useAggregatedAlphas(selectedKey?.publicKey.key ?? null);

  return (
    <TokenContent selectedKey={selectedKey} query={alphas}>
      {alphas.data && (
        <Link key={ALPHA_KEY} to={`/units/alpha/${ALPHA_KEY}`}>
          <AggregatedAlphaItem
            symbol={alphas.data.symbol}
            icon={alphas.data.icon}
            decimalPlaces={alphas.data.decimalPlaces}
            value={alphas.data.total}
          />
        </Link>
      )}
    </TokenContent>
  );
}
