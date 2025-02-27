import { PropsWithChildren, ReactElement } from 'react';

import { ITokenIcon } from '../../../hooks/tokens/ITokenIcon';
import { formatValueWithDecimalPlaces } from '../../../utils/decimal';
import { TokenIcon } from '../TokenIcon';

interface IAggregatedAlphaItemProps {
  readonly decimalPlaces: number;
  readonly icon: ITokenIcon | null;
  readonly symbol: string;
  readonly value: bigint;
}

export function AggregatedAlphaItem(props: PropsWithChildren<IAggregatedAlphaItemProps>): ReactElement {
  const { decimalPlaces, icon, symbol, value } = props;

  return (
    <div className={`units__content__unit hoverable`}>
      <div className="units__content__unit--icon">
        <TokenIcon icon={icon} symbol={symbol} />
      </div>
      <div className="units__content__unit--text">{symbol}</div>
      <div className="units__content__unit--value">{formatValueWithDecimalPlaces(value, decimalPlaces)}</div>
    </div>
  );
}
