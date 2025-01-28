import { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { TokenItem } from './TokenItem';
import { ErrorNotification } from '../../../components/ErrorNotification/ErrorNotification';
import { Loading } from '../../../components/Loading/Loading';
import { useAlphabill } from '../../../hooks/alphabill';
import { useUnits } from '../../../hooks/units';
import { useVault } from '../../../hooks/vault';
import BackIcon from '../../../images/back-ico.svg?react';

export function TokenDetails(): ReactElement {
  const alphabill = useAlphabill();
  const { selectedKey } = useVault();
  const params = useParams<{ id: string }>();
  const { fungible } = useUnits();

  if (!alphabill) {
    return (
      <div className="units--error">
        <ErrorNotification title="No network selected" info={<Link to="/units/fungible">Go back</Link>} />
      </div>
    );
  }

  if (!selectedKey) {
    return (
      <div className="units--error">
        <ErrorNotification title="No key selected" info={<Link to="/units/fungible">Go back</Link>} />
      </div>
    );
  }

  if (fungible.isLoading) {
    return <Loading title="Loading..." />;
  }

  if (fungible.error) {
    return <ErrorNotification title="Error occurred" info={fungible.error.message} />;
  }

  const tokenInfo = fungible.data?.get(params.id ?? '');
  if (!tokenInfo) {
    return <>No token found</>;
  }

  return (
    <div className="units__info">
      <div className="units__info__header">
        <Link to="/" className="back-btn">
          <BackIcon />
        </Link>
        <div className="units__info__title">{tokenInfo.name}</div>
      </div>
      <div className="units__info__content">
        {tokenInfo.units.map((token) => {
          return (
            <TokenItem
              key={token.id}
              name={tokenInfo.name}
              icon={tokenInfo.icon}
              decimalPlaces={tokenInfo.decimalPlaces}
              value={token.value}
            />
          );
        })}
      </div>
    </div>
  );
}
