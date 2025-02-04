import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { FungibleToken } from '@alphabill/alphabill-js-sdk/lib/tokens/FungibleToken';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { TokenItem } from './TokenItem';
import { ErrorNotification } from '../../../components/ErrorNotification/ErrorNotification';
import { Loading } from '../../../components/Loading/Loading';
import { ALPHA_KEY } from '../../../constants';
import { useAlphas } from '../../../hooks/alpha';
import { useAlphabill } from '../../../hooks/alphabill';
import { useFungibleTokens } from '../../../hooks/fungible';
import { useVault } from '../../../hooks/vault';
import BackIcon from '../../../images/back-ico.svg?react';

export function TokenDetails(): ReactElement {
  const alphabill = useAlphabill();
  const { selectedKey } = useVault();
  const params = useParams<{ id: string }>();
  const { fungible } = useFungibleTokens();
  const { alpha } = useAlphas();

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

  if (fungible.isPending || alpha.isPending) {
    return <Loading title="Loading..." />;
  }

  if (fungible.isError || alpha.isError) {
    const error = fungible.error || alpha.error;

    return (
      <div className="units--error">
        <ErrorNotification
          title="Error occurred"
          info={
            <>
              {error?.message} <br />
              <Link to="/units/fungible">Go back</Link>
            </>
          }
        />
      </div>
    );
  }

  const tokenInfo = params.id === ALPHA_KEY ? alpha.data : fungible.data.find((token) => token.id === params.id);
  if (!tokenInfo) {
    return (
      <div className="units--error">
        <ErrorNotification
          title="No token found"
          info={
            <>
              <Link to="/units/fungible">Go back</Link>
            </>
          }
        />
      </div>
    );
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
        {tokenInfo.units.map((token: Bill | FungibleToken) => {
          return (
            <TokenItem
              key={Base16Converter.encode(token.unitId.bytes)}
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
