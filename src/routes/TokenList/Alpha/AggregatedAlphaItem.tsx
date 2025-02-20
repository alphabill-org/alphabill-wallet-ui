import { PropsWithChildren, ReactElement, useState } from 'react';

import { ITokenIcon } from '../../../hooks/tokens/ITokenIcon';
import { formatValueWithDecimalPlaces } from '../../../utils/decimal';

interface IAggregatedAlphaItemProps {
  readonly decimalPlaces: number;
  readonly icon: ITokenIcon;
  readonly name: string;
  readonly value: bigint;
}

export function AggregatedAlphaItem(props: PropsWithChildren<IAggregatedAlphaItemProps>): ReactElement {
  const { decimalPlaces, icon, name, value } = props;
  const [error, setError] = useState<boolean>(false);
  return (
    <div className={`units__content__unit hoverable`}>
      <div className="units__content__unit--icon">
        {error ? (
          <span style={{ color: '#000' }}>
            {name
              .split(' ')
              .slice(0, 2)
              .map((el) => el.at(0)?.toUpperCase() ?? '')
              .join('')}
          </span>
        ) : (
          <img
            src={`data:${icon.type};base64,${icon.data}`}
            alt={name}
            onError={() => {
              setError(true);
            }}
          />
        )}
      </div>
      <div className="units__content__unit--text">{name}</div>
      <div className="units__content__unit--value">{formatValueWithDecimalPlaces(value, decimalPlaces)}</div>
    </div>
  );
}
