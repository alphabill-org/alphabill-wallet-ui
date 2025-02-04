import { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { TokenItem } from './TokenItem';
import { ErrorNotification } from '../../../components/ErrorNotification/ErrorNotification';
import { Loading } from '../../../components/Loading/Loading';
import { ALPHA_KEY } from '../../../constants';
import { useAlphas } from '../../../hooks/alpha';
import { useAlphabill } from '../../../hooks/alphabill';
import { useFungibleTokens } from '../../../hooks/fungible';
import { useVault } from '../../../hooks/vault';

export function AggregatedTokenList(): ReactElement {
  const alphabill = useAlphabill();
  const { selectedKey } = useVault();
  const { fungibleTokensByType } = useFungibleTokens();
  const { alphasInfo } = useAlphas();

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

  if (fungibleTokensByType.isPending || alphasInfo.isPending) {
    return (
      <div className="units--loading">
        <Loading title="Loading..." />
      </div>
    );
  }

  if (fungibleTokensByType.isError || alphasInfo.isError) {
    const error = fungibleTokensByType.error || alphasInfo.error;
    return (
      <div className="units--error">
        <ErrorNotification title="Error occurred" info={error?.message} />
      </div>
    );
  }

  const tokenItems = [
    <Link key={ALPHA_KEY} to={`/units/fungible/${ALPHA_KEY}`}>
      <TokenItem
        name={alphasInfo.data.name}
        icon={alphasInfo.data.icon}
        decimalPlaces={alphasInfo.data.decimalPlaces}
        value={alphasInfo.data.total}
        isAggregated={true}
      />
    </Link>,
  ];

  for (const token of fungibleTokensByType.data.values()) {
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
