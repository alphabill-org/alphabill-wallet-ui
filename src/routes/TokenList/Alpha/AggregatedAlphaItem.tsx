import { PropsWithChildren, ReactElement } from 'react';

import { ITokenIcon } from '../../../hooks/tokens/ITokenIcon';
import { formatValueWithDecimalPlaces } from '../../../utils/decimal';
import { TokenIcon } from '../TokenIcon';

interface IAggregatedAlphaItemProps {
  readonly decimalPlaces: number;
  readonly icon: ITokenIcon | null;
  readonly name: string;
  readonly value: bigint;
}

export function AggregatedAlphaItem(props: PropsWithChildren<IAggregatedAlphaItemProps>): ReactElement {
  const { decimalPlaces, icon, name, value } = props;

  return (
    <div className={`units__content__unit hoverable`}>
      <div className="units__content__unit--icon">
        <TokenIcon icon={icon} name={name} />
      </div>
      <div className="units__content__unit--text">{name}</div>
      <div className="units__content__unit--value">{formatValueWithDecimalPlaces(value, decimalPlaces)}</div>
    </div>
  );
}
