import { PropsWithChildren, ReactElement } from 'react';

import { ITokenIcon } from '../../hooks/tokens/ITokenIcon';

interface ITokenIconProps {
  readonly icon: ITokenIcon | null;
  readonly symbol: string;
}

export function TokenIcon(props: PropsWithChildren<ITokenIconProps>): ReactElement {
  const { icon, symbol } = props;

  if (!icon) {
    return <span style={{ color: '#000' }}>{symbol[0].toUpperCase()}</span>;
  }

  return <img src={`data:${icon.type};base64,${icon.data}`} alt={symbol} />;
}
