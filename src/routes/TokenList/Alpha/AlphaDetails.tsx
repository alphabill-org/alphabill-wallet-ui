import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { AlphaItem } from './AlphaItem';
import { ErrorNotification } from '../../../components/ErrorNotification/ErrorNotification';
import { Loading } from '../../../components/Loading/Loading';
import { Navbar } from '../../../components/NavBar/NavBar';
import { useAggregatedAlphas } from '../../../hooks/aggregatedAlpha';
import { useVault } from '../../../hooks/vaultContext';

export function AlphaDetails(): ReactElement {
  const { selectedKey } = useVault();
  const alphas = useAggregatedAlphas(selectedKey?.publicKey.key ?? null);

  if (!selectedKey) {
    return (
      <div className="units--error">
        <ErrorNotification title="No key selected" info={<Link to="/units/alpha">Go back</Link>} />
      </div>
    );
  }

  if (alphas.isPending) {
    return <Loading title="Loading..." />;
  }

  if (alphas.isError) {
    return (
      <div className="units--error">
        <ErrorNotification
          title="Error occurred"
          info={
            <>
              {alphas.error.message} <br />
              <Link to="/units/alpha">Go back</Link>
            </>
          }
        />
      </div>
    );
  }

  const alphaInfo = alphas.data;
  if (!alphaInfo) {
    return (
      <div className="units--error">
        <ErrorNotification
          title="No alpha found"
          info={
            <>
              <Link to="/units/alpha">Go back</Link>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="units__info">
      <Navbar title={alphaInfo.name} />
      <div className="units__info__content">
        {alphaInfo.units.map((alpha: Bill) => {
          return (
            <AlphaItem
              key={Base16Converter.encode(alpha.unitId.bytes)}
              id={alpha.unitId.toString()}
              decimalPlaces={alphaInfo.decimalPlaces}
              value={alpha.value}
            />
          );
        })}
      </div>
    </div>
  );
}
