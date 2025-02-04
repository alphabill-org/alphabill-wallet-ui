import { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { TokenItem } from './TokenItem';
import { ErrorNotification } from '../../../components/ErrorNotification/ErrorNotification';
import { Loading } from '../../../components/Loading/Loading';
import { useAlphabill } from '../../../hooks/alphabill';
import { ITokenInfo, useUnits } from '../../../hooks/units';
import { useVault } from '../../../hooks/vault';

export function AggregatedTokenList(): ReactElement {
  const alphabill = useAlphabill();
  const { selectedKey } = useVault();
  const { fungible, alpha } = useUnits();

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

  if (fungible.isPending || alpha.isPending) {
    return (
      <div className="units--loading">
        <Loading title="Loading..." />
      </div>
    );
  }

  if (fungible.isError || alpha.isError) {
    const error = fungible.error || alpha.error;
    return (
      <div className="units--error">
        <ErrorNotification title="Error occurred" info={error?.message} />
      </div>
    );
  }

  const tokenItems = [];
  const tokens: ITokenInfo[] = [alpha.data, ...fungible.data];
  for (const token of tokens) {
    tokenItems.push(
      <Link key={token.id} to={`/units/fungible/${token.id}`}>
        <TokenItem
          name={token.name}
          icon={token.icon}
          decimalPlaces={token.decimalPlaces}
          value={token.total}
          isAggregated={true}
        />
      </Link>,
    );
  }

  return <div className="units__content">{tokenItems}</div>;
}
