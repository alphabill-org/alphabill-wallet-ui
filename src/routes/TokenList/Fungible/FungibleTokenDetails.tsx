import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { FungibleToken } from '@alphabill/alphabill-js-sdk/lib/tokens/FungibleToken';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { FungibleTokenItem } from './FungibleTokenItem';
import { ErrorNotification } from '../../../components/ErrorNotification/ErrorNotification';
import { Loading } from '../../../components/Loading/Loading';
import { ALPHA_KEY } from '../../../constants';
import { useAggregatedAlphas } from '../../../hooks/aggregatedAlpha';
import { useAggregatedFungibleTokens } from '../../../hooks/aggregatedFungibleTokens';
import { useAlphabill } from '../../../hooks/alphabillContext';
import { useVault } from '../../../hooks/vaultContext';
import BackIcon from '../../../images/back-ico.svg?react';

export function FungibleTokenDetails(): ReactElement {
  const alphabill = useAlphabill();
  const { selectedKey } = useVault();
  const params = useParams<{ id: string }>();
  const fungibleTokens = useAggregatedFungibleTokens(selectedKey?.publicKey.key ?? null);
  const alphas = useAggregatedAlphas(selectedKey?.publicKey.key ?? null);

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

  if (fungibleTokens.isPending || alphas.isPending) {
    return <Loading title="Loading..." />;
  }

  if (fungibleTokens.isError || alphas.isError) {
    const error = fungibleTokens.error || alphas.error;

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

  const tokenInfo = params.id === ALPHA_KEY ? alphas.data : fungibleTokens.data?.get(params.id ?? '');
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
        <div>{tokenInfo.name}</div>
      </div>
      <div className="units__info__content">
        {tokenInfo.units.map((token: Bill | FungibleToken) => {
          return (
            <FungibleTokenItem
              key={Base16Converter.encode(token.unitId.bytes)}
              id={token.unitId.toString()}
              decimalPlaces={tokenInfo.decimalPlaces}
              value={token.value}
            />
          );
        })}
      </div>
    </div>
  );
}
