import { PropsWithChildren, ReactElement, useState } from 'react';

import { ITokenIcon } from '../../hooks/tokens/ITokenIcon';

interface ITokenIconProps {
  readonly icon: ITokenIcon | null;
  readonly name: string;
}

export function TokenIcon(props: PropsWithChildren<ITokenIconProps>): ReactElement {
  const { icon, name } = props;
  const [error, setError] = useState<boolean>(false);

  if (error || !icon) {
    return (
      <span style={{ color: '#000' }}>
        {name
          .split(' ')
          .slice(0, 2)
          .map((el) => el.at(0)?.toUpperCase() ?? '')
          .join('')}
      </span>
    );
  }

  return (
    <img
      src={`data:${icon.type};base64,${icon.data}`}
      alt={name}
      onError={() => {
        setError(true);
      }}
    />
  );
}
