import { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { AggregatedTokenItem } from './AggregatedTokenItem';
import { ErrorNotification } from '../../../components/ErrorNotification/ErrorNotification';
import { Loading } from '../../../components/Loading/Loading';
import { ALPHA_KEY } from '../../../constants';
import { useAggregatedAlphas } from '../../../hooks/aggregatedAlpha';
import { useAggregatedFungibleTokens } from '../../../hooks/aggregatedFungibleTokens';
import { useAlphabill } from '../../../hooks/alphabillContext';
import { useVault } from '../../../hooks/vaultContext';

export function AggregatedTokenList(): ReactElement {
  const alphabill = useAlphabill();
  const { selectedKey } = useVault();
  const fungibleTokens = useAggregatedFungibleTokens(selectedKey?.publicKey.key ?? null);
  const alphas = useAggregatedAlphas(selectedKey?.publicKey.key ?? null);

  if (!alphabill) {
    return (
      <div className="units--error">
        <ErrorNotification
          title="No network selected"
          info="Select network from the header. If no network exists, add it from settings."
        />
      </div>
    );
  }

  if (!selectedKey) {
    return (
      <div className="units--error">
        <ErrorNotification title="No key selected" info="Select key from the selectbox above." />
      </div>
    );
  }

  if (fungibleTokens.isPending || alphas.isPending) {
    return (
      <div className="units--loading">
        <Loading title="Loading..." />
      </div>
    );
  }

  if (fungibleTokens.isError || alphas.isError) {
    const error = fungibleTokens.error || alphas.error;
    return (
      <div className="units--error">
        <ErrorNotification title="Error occurred" info={error?.message} />
      </div>
    );
  }

  const tokenItems: ReactElement[] = [];

  if (alphas.data) {
    tokenItems.push(
      <Link key={ALPHA_KEY} to={`/units/fungible/${ALPHA_KEY}`}>
        <AggregatedTokenItem
          name={alphas.data.name}
          icon={alphas.data.icon}
          decimalPlaces={alphas.data.decimalPlaces}
          value={alphas.data.total}
        />
      </Link>,
    );
  }

  if (fungibleTokens.data) {
    for (const token of fungibleTokens.data.values()) {
      tokenItems.push(
        <Link key={token.id} to={`/units/fungible/${token.id}`}>
          <AggregatedTokenItem
            name={token.name}
            icon={token.icon}
            decimalPlaces={token.decimalPlaces}
            value={token.total}
          />
        </Link>,
      );
    }
  }

  return <div className="units__content">{tokenItems}</div>;
}
