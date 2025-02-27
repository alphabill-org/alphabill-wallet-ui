import { FungibleToken } from '@alphabill/alphabill-js-sdk/lib/tokens/FungibleToken';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { FungibleTokenItem } from './FungibleTokenItem';
import { ErrorNotification } from '../../../components/ErrorNotification/ErrorNotification';
import { Loading } from '../../../components/Loading/Loading';
import { Navbar } from '../../../components/NavBar/NavBar';
import { useAggregatedFungibleTokens } from '../../../hooks/aggregatedFungibleTokens';
import { useVault } from '../../../hooks/vaultContext';

export function FungibleTokenDetails(): ReactElement {
  const { selectedKey } = useVault();
  const params = useParams<{ id: string }>();
  const fungibleTokens = useAggregatedFungibleTokens(selectedKey?.publicKey.key ?? null);

  if (!selectedKey) {
    return (
      <div className="units--error">
        <ErrorNotification title="No key selected" info={<Link to="/units/fungible">Go back</Link>} />
      </div>
    );
  }

  if (fungibleTokens.isPending) {
    return <Loading title="Loading..." />;
  }

  if (fungibleTokens.isError) {
    return (
      <div className="units--error">
        <ErrorNotification
          title="Error occurred"
          info={
            <>
              {fungibleTokens.error.message} <br />
              <Link to="/units/fungible">Go back</Link>
            </>
          }
        />
      </div>
    );
  }

  const tokenInfo = fungibleTokens.data?.get(params.id ?? '');
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
      <Navbar title={tokenInfo.symbol} />
      <div className="units__info__content">
        {tokenInfo.units.map((token: FungibleToken) => {
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
