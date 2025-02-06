import { ReactElement, useState } from 'react';

import { ITokenIcon } from '../../../hooks/units/ITokenIcon';
import { formatValueWithDecimalPlaces } from '../../../utils/decimal';

export function TokenItem({
  name,
  icon,
  value,
  decimalPlaces,
  isAggregated,
}: {
  name: string;
  icon: ITokenIcon;
  value: bigint;
  decimalPlaces: number;
  isAggregated?: boolean;
}): ReactElement {
  const [error, setError] = useState<boolean>(false);

  return (
    <div className={`units__content__unit ${isAggregated ? 'hoverable' : ''}`}>
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
